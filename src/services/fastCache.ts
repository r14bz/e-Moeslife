const STORAGE_PREFIX = "em-swr:v1:";
const MAX_LOCAL_ITEM_CHARS = 650_000;

interface MemoryEntry<T = unknown> {
  value: T;
  savedAt: number;
  freshUntil: number;
  staleUntil: number;
}

interface StoredEntry<T = unknown> {
  v: T;
  t: number; // savedAt
  f: number; // freshUntil
  s: number; // staleUntil
}

const memoryCache = new Map<string, MemoryEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

export interface CacheReadResult<T> {
  value: T;
  isStale: boolean;
  savedAt: number;
}

export function readSwrCache<T>(key: string, allowExpired = false): CacheReadResult<T> | null {
  const now = Date.now();
  const mem = memoryCache.get(key);
  if (mem) {
    if (allowExpired || now <= mem.staleUntil) {
      return {
        value: mem.value as T,
        isStale: now > mem.freshUntil,
        savedAt: mem.savedAt,
      };
    }
    memoryCache.delete(key);
  }

  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEntry<T>;
    if (!parsed || typeof parsed !== "object" || !("v" in parsed)) return null;

    if (!allowExpired && now > parsed.s) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return null;
    }

    memoryCache.set(key, {
      value: parsed.v,
      savedAt: parsed.t,
      freshUntil: parsed.f,
      staleUntil: parsed.s,
    });

    return {
      value: parsed.v,
      isStale: now > parsed.f,
      savedAt: parsed.t,
    };
  } catch {
    return null;
  }
}

function pruneOldestStorageEntries(keepCount = 6): void {
  if (typeof localStorage === "undefined") return;
  try {
    const candidates: Array<{ storageKey: string; savedAt: number }> = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const storageKey = localStorage.key(i);
      if (!storageKey || !storageKey.startsWith(STORAGE_PREFIX)) continue;
      let savedAt = 0;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<StoredEntry>;
          if (typeof parsed.t === "number") savedAt = parsed.t;
        }
      } catch {
        // corrupt entry gets evicted first (savedAt = 0)
      }
      candidates.push({ storageKey, savedAt });
    }
    candidates.sort((a, b) => a.savedAt - b.savedAt);
    const removeCount = Math.max(1, candidates.length - keepCount);
    for (let i = 0; i < removeCount && i < candidates.length; i += 1) {
      localStorage.removeItem(candidates[i].storageKey);
    }
  } catch {
    // ignore storage errors
  }
}

export function writeSwrCache<T>(
  key: string,
  value: T,
  options: { freshTtlMs: number; staleTtlMs?: number; persist?: boolean }
): void {
  const now = Date.now();
  const freshUntil = now + Math.max(0, options.freshTtlMs);
  const staleUntil = now + Math.max(options.freshTtlMs, options.staleTtlMs ?? options.freshTtlMs * 4);

  memoryCache.set(key, {
    value,
    savedAt: now,
    freshUntil,
    staleUntil,
  });

  if (options.persist === false || typeof localStorage === "undefined") return;

  try {
    const payload: StoredEntry<T> = {
      v: value,
      t: now,
      f: freshUntil,
      s: staleUntil,
    };
    const serialized = JSON.stringify(payload);
    if (serialized.length > MAX_LOCAL_ITEM_CHARS) return;

    const fullKey = `${STORAGE_PREFIX}${key}`;
    try {
      localStorage.setItem(fullKey, serialized);
    } catch {
      pruneOldestStorageEntries(8);
      try {
        localStorage.setItem(fullKey, serialized);
      } catch {
        // ignore if storage remains full
      }
    }
  } catch {
    // ignore serialization or storage restrictions
  }
}

function raceWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (val) => {
        signal.removeEventListener("abort", onAbort);
        resolve(val);
      },
      (err) => {
        signal.removeEventListener("abort", onAbort);
        reject(err);
      }
    );
  });
}

export async function runDeduplicated<T>(
  key: string,
  task: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  let promise = inflightRequests.get(key) as Promise<T> | undefined;
  if (!promise) {
    promise = task().finally(() => {
      inflightRequests.delete(key);
    });
    inflightRequests.set(key, promise);
  }
  return raceWithSignal(promise, signal);
}

export async function fetchWithSwr<T>(options: {
  key: string;
  freshTtlMs: number;
  staleTtlMs?: number;
  persist?: boolean;
  signal?: AbortSignal;
  fetcher: () => Promise<T>;
  onBackgroundRefresh?: (fresh: T) => void;
}): Promise<T> {
  const cached = readSwrCache<T>(options.key, false);

  if (cached && !cached.isStale) {
    return cached.value;
  }

  if (cached && cached.isStale) {
    // Return cached data immediately while refreshing silently in background
    void runDeduplicated(options.key, async () => {
      const fresh = await options.fetcher();
      writeSwrCache(options.key, fresh, options);
      options.onBackgroundRefresh?.(fresh);
      return fresh;
    }).catch(() => undefined);
    return cached.value;
  }

  // Fallback to expired offline data only if network fails
  const offlineFallback = readSwrCache<T>(options.key, true);
  try {
    return await runDeduplicated(
      options.key,
      async () => {
        const fresh = await options.fetcher();
        writeSwrCache(options.key, fresh, options);
        return fresh;
      },
      options.signal
    );
  } catch (err) {
    if (options.signal?.aborted) throw err;
    if (offlineFallback) {
      return offlineFallback.value;
    }
    throw err;
  }
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 12000
): Promise<Response> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  const forwardAbort = () => controller.abort();
  if (init.signal) {
    if (init.signal.aborted) {
      globalThis.clearTimeout(timer);
      controller.abort();
    } else {
      init.signal.addEventListener("abort", forwardAbort, { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timer);
    if (init.signal) {
      init.signal.removeEventListener("abort", forwardAbort);
    }
  }
}
