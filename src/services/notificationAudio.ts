export type NotificationSoundKind = "prayer" | "adzan" | "adzan_subuh" | "update";

export type NotificationAudioPlayResult = "playing" | "blocked" | "fallback" | "unsupported";

export interface NotificationAudioState {
  isPlaying: boolean;
  kind: NotificationSoundKind | null;
  label: string;
  blocked: boolean;
  blockedPrayerLabel: string;
  blockedKind: NotificationSoundKind | null;
}

const SOUND_PATHS: Record<NotificationSoundKind, string> = {
  prayer: "/assets/sounds/notif_shalat.wav",
  adzan: "/assets/sounds/adzan.mp3",
  adzan_subuh: "/assets/sounds/adzan_subuh.mp3",
  update: "/assets/sounds/notif_update.wav",
};

let activeAudio: HTMLAudioElement | null = null;
let state: NotificationAudioState = {
  isPlaying: false,
  kind: null,
  label: "",
  blocked: false,
  blockedPrayerLabel: "",
  blockedKind: null,
};

const listeners = new Set<(next: NotificationAudioState) => void>();

function emitState() {
  const snapshot = { ...state };
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // ignore subscriber errors
    }
  });
}

export function getNotificationAudioState(): NotificationAudioState {
  return { ...state };
}

export function subscribeNotificationAudio(
  listener: (next: NotificationAudioState) => void
): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => {
    listeners.delete(listener);
  };
}

export function clearBlockedNotificationAudio(): void {
  if (!state.blocked && !state.blockedPrayerLabel && !state.blockedKind) return;
  state = {
    ...state,
    blocked: false,
    blockedPrayerLabel: "",
    blockedKind: null,
  };
  emitState();
}

export function stopNotificationAudio(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore cleanup failures
    }
    activeAudio = null;
  }
  if (state.isPlaying || state.kind !== null || state.label) {
    state = {
      ...state,
      isPlaying: false,
      kind: null,
      label: "",
    };
    emitState();
  }
}

function playWebAudioFallback(kind: NotificationSoundKind): boolean {
  if (typeof window === "undefined") return false;
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return false;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes =
      kind === "update"
        ? [
            { freq: 587.33, offset: 0, dur: 0.25 },
            { freq: 880.0, offset: 0.14, dur: 0.45 },
          ]
        : [
            { freq: 392.0, offset: 0, dur: 0.45 },
            { freq: 493.88, offset: 0.16, dur: 0.45 },
            { freq: 587.33, offset: 0.32, dur: 0.5 },
            { freq: 783.99, offset: 0.5, dur: 0.7 },
          ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, now + note.offset);
      gain.gain.setValueAtTime(0.001, now + note.offset);
      gain.gain.linearRampToValueAtTime(0.18, now + note.offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.offset + note.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.offset);
      osc.stop(now + note.offset + note.dur + 0.05);
    }
    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 1800);
    return true;
  } catch {
    return false;
  }
}

export async function playNotificationSound(
  kind: NotificationSoundKind,
  options?: { label?: string }
): Promise<NotificationAudioPlayResult> {
  if (typeof window === "undefined") return "unsupported";

  const isAdzan = kind === "adzan" || kind === "adzan_subuh";
  const label = options?.label || (kind === "adzan_subuh" ? "Adzan Subuh" : isAdzan ? "Adzan" : "");

  stopNotificationAudio();

  try {
    const audio = new Audio(SOUND_PATHS[kind]);
    audio.volume = isAdzan ? 0.92 : 0.85;
    audio.preload = "auto";
    activeAudio = audio;

    audio.addEventListener("ended", () => {
      if (activeAudio === audio) {
        activeAudio = null;
        state = {
          isPlaying: false,
          kind: null,
          label: "",
          blocked: false,
          blockedPrayerLabel: "",
          blockedKind: null,
        };
        emitState();
      }
    });

    audio.addEventListener("error", () => {
      if (activeAudio === audio) {
        activeAudio = null;
        state = {
          ...state,
          isPlaying: false,
          kind: null,
          label: "",
        };
        emitState();
      }
    });

    await audio.play();

    state = {
      isPlaying: true,
      kind,
      label,
      blocked: false,
      blockedPrayerLabel: "",
      blockedKind: null,
    };
    emitState();
    return "playing";
  } catch {
    if (activeAudio) {
      activeAudio = null;
    }

    if (isAdzan) {
      state = {
        isPlaying: false,
        kind: null,
        label: "",
        blocked: true,
        blockedPrayerLabel: label,
        blockedKind: kind,
      };
      emitState();
      return "blocked";
    }

    return playWebAudioFallback(kind) ? "fallback" : "unsupported";
  }
}
