import type { DailyPrayerSchedule, PrayerLocation, SkyScene } from "../types/emoeslife";

const SHALAT_API = "https://equran.id/api/v2/shalat";
export const PRAYER_STORAGE_KEY = "em-prayer-location-v1";

export const DEFAULT_LOCATION: PrayerLocation = {
  provinsi: "DKI Jakarta",
  kabkota: "Kota Jakarta Pusat",
  label: "Jakarta Pusat",
  timezone: "Asia/Jakarta",
  zone: "WIB",
};

export const PRAYERS: ReadonlyArray<{ key: keyof DailyPrayerSchedule; label: string }> = [
  { key: "subuh", label: "Subuh" },
  { key: "dzuhur", label: "Dzuhur" },
  { key: "ashar", label: "Ashar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isya", label: "Isya" },
];

const pad = (value: number | string): string => String(value).padStart(2, "0");

export const normalizeRegion = (value: string): string =>
  String(value || "")
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const regionKey = (value: string): string =>
  normalizeRegion(value).replace(
    /^(daerahkhususibukota|provinsi|kabupatenadministrasi|kabupaten|kab|kotaadministrasi|kota)/,
    ""
  );

export const findRegion = (items: string[], value: string): string | undefined =>
  items.find((item) => regionKey(item) === regionKey(value)) ||
  items.find((item) => regionKey(item).includes(regionKey(value)) || regionKey(value).includes(regionKey(item)));

const ZONE_WIB = { timezone: "Asia/Jakarta", zone: "WIB" as const };
const ZONE_WITA = { timezone: "Asia/Makassar", zone: "WITA" as const };
const ZONE_WIT = { timezone: "Asia/Jayapura", zone: "WIT" as const };

const WIT_PROVINCES = [
  "maluku",
  "malukuutara",
  "papua",
  "papuabarat",
  "papuabaratdaya",
  "papuapegunungan",
  "papuaselatan",
  "papuatengah",
];
const WITA_PROVINCES = [
  "bali",
  "nusatenggarabarat",
  "nusatenggaratimur",
  "kalimantanselatan",
  "kalimantantimur",
  "kalimantanutara",
  "sulawesiutara",
  "sulawesitengah",
  "sulawesiselatan",
  "sulawesitenggara",
  "sulawesibarat",
  "gorontalo",
];
const WIB_PROVINCES = [
  "aceh",
  "sumaterautara",
  "sumaterabarat",
  "riau",
  "kepulauanriau",
  "jambi",
  "sumateraselatan",
  "bengkulu",
  "bangkabelitung",
  "kepulauanbangkabelitung",
  "lampung",
  "dkijakarta",
  "jakarta",
  "jawabarat",
  "jawatengah",
  "jawatimur",
  "banten",
  "diyogyakarta",
  "yogyakarta",
  "kalimantanbarat",
  "kalimantantengah",
];

export function getZoneForProvince(province: string) {
  const key = normalizeRegion(province).replace(/^(provinsi|daerahkhususibukota|daerahistimewa)/, "");
  if (WIT_PROVINCES.includes(key)) return { ...ZONE_WIT };
  if (WITA_PROVINCES.includes(key)) return { ...ZONE_WITA };
  if (WIB_PROVINCES.includes(key)) return { ...ZONE_WIB };
  return null;
}

export function getZoneByLongitude(longitude: number) {
  if (longitude >= 129) return { ...ZONE_WIT };
  if (longitude >= 115) return { ...ZONE_WITA };
  return { ...ZONE_WIB };
}

export function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value])) as {
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
    second: string;
  };
}

export function timeMinutes(value?: string | number): number {
  const [h, m] = String(value || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

export function formatTimeMinutes(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
}

export const PRAYER_GRACE_MINUTES = 30;

export interface PrayerTickerStatus {
  inGrace: boolean;
  primaryLabel: string;
  countdownText: string;
  subNote: string;
  activePrayerKey: string;
}

export function computePrayerTicker(
  schedule: DailyPrayerSchedule,
  hour: number,
  minute: number,
  second: number
): PrayerTickerStatus {
  const currentMinutes = hour * 60 + minute;
  const timeline = PRAYERS.map((item) => ({
    ...item,
    minutes: timeMinutes(schedule[item.key]),
  }));

  const currentInGrace = timeline.find((item) => {
    const elapsed = currentMinutes - item.minutes;
    return elapsed >= 0 && elapsed < PRAYER_GRACE_MINUTES;
  });

  if (currentInGrace) {
    const startStr = formatTimeMinutes(currentInGrace.minutes);
    const endStr = formatTimeMinutes(currentInGrace.minutes + PRAYER_GRACE_MINUTES);
    return {
      inGrace: true,
      primaryLabel: `Masuk waktu ${currentInGrace.label}`,
      countdownText: `${startStr} – ${endStr}`,
      subNote: `Hitung mundur berikutnya pukul ${endStr}`,
      activePrayerKey: String(currentInGrace.key),
    };
  }

  const next = timeline.find((item) => item.minutes > currentMinutes) || timeline[0];
  const delta =
    (next.minutes + (next.minutes <= currentMinutes ? 1440 : 0) - currentMinutes) * 60000 -
    second * 1000;
  const passed = timeline.filter((item) => item.minutes <= currentMinutes).at(-1);

  return {
    inGrace: false,
    primaryLabel: `Menuju ${next.label}`,
    countdownText: formatCountdown(delta),
    subNote: "",
    activePrayerKey: passed ? String(passed.key) : "",
  };
}

export function getScene(now: Date, timezone: string, schedule: DailyPrayerSchedule | null): SkyScene {
  const parts = localParts(now, timezone);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const sunrise = timeMinutes(schedule?.terbit || "06:00");
  const fajr = timeMinutes(schedule?.subuh || "04:30");
  const asr = timeMinutes(schedule?.ashar || "15:00");
  const maghrib = timeMinutes(schedule?.maghrib || "18:00");
  if (minutes < fajr - 35) return "night";
  if (minutes < sunrise - 20) return "dawn";
  if (minutes < sunrise + 40) return "sunrise";
  if (minutes < asr) return "day";
  if (minutes < maghrib - 35) return "afternoon";
  if (minutes < maghrib + 35) return "sunset";
  return "night";
}

export const REFRESH_RETRY_MS = 30000;

export function shouldRetryRefresh({
  tickDateKey,
  activeDateKey,
  refreshing,
  lastAttemptAt,
  now,
  retryMs = REFRESH_RETRY_MS,
}: {
  tickDateKey: string;
  activeDateKey: string;
  refreshing: boolean;
  lastAttemptAt: number;
  now: number;
  retryMs?: number;
}): boolean {
  if (tickDateKey === activeDateKey || refreshing) return false;
  return !Number.isFinite(lastAttemptAt) || now - lastAttemptAt >= retryMs;
}

function cacheKey(location: PrayerLocation, year: number, month: number): string {
  return `em-prayer-cache:${normalizeRegion(location.provinsi)}:${normalizeRegion(location.kabkota)}:${year}-${pad(month)}`;
}

async function fetchWithTimeout<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error("Layanan jadwal shalat tidak merespons.");
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function postShalat<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return fetchWithTimeout<T>(`${SHALAT_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getProvinces(): Promise<string[]> {
  const payload = await fetchWithTimeout<{ code: number; data?: string[] }>(`${SHALAT_API}/provinsi`);
  if (payload.code !== 200 || !Array.isArray(payload.data)) {
    throw new Error("Daftar provinsi tidak tersedia.");
  }
  return payload.data;
}

export async function getCities(province: string): Promise<string[]> {
  const payload = await postShalat<{ code: number; data?: string[] }>("/kabkota", { provinsi: province });
  if (payload.code !== 200 || !Array.isArray(payload.data)) {
    throw new Error("Daftar kota tidak tersedia.");
  }
  return payload.data;
}

export async function loadMonthlySchedule(
  location: PrayerLocation,
  year: number,
  month: number
): Promise<{ jadwal: DailyPrayerSchedule[] }> {
  const key = cacheKey(location, year, month);
  try {
    const payload = await postShalat<{ code: number; data?: { jadwal?: DailyPrayerSchedule[] } }>("", {
      provinsi: location.provinsi,
      kabkota: location.kabkota,
      bulan: month,
      tahun: year,
    });
    if (payload.code !== 200 || !payload.data?.jadwal?.length) {
      throw new Error("Jadwal untuk lokasi ini belum tersedia.");
    }
    try {
      localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data: payload.data }));
    } catch {
      // ignore cache errors
    }
    return { jadwal: payload.data.jadwal };
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem(key) || "null") as {
        data?: { jadwal?: DailyPrayerSchedule[] };
      } | null;
      if (cached?.data?.jadwal?.length) return { jadwal: cached.data.jadwal };
    } catch {
      // ignore
    }
    throw error;
  }
}

export async function detectLocation(): Promise<PrayerLocation> {
  if (!navigator.geolocation) throw new Error("GPS tidak tersedia.");
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 3600000,
    })
  );
  const { latitude, longitude } = position.coords;
  const fallbackZone = getZoneByLongitude(longitude);
  const reverse = await fetchWithTimeout<{
    principalSubdivisionCode?: string;
    principalSubdivision?: string;
    city?: string;
    locality?: string;
    localityInfo?: { administrative?: Array<{ adminLevel?: number; name?: string }> };
  }>(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      latitude
    )}&longitude=${encodeURIComponent(longitude)}&localityLanguage=id`
  );

  const admin = reverse.localityInfo?.administrative || [];
  const provinceAliases: Record<string, string> = {
    "ID-JK": "DKI Jakarta",
    "ID-JB": "Jawa Barat",
    "ID-JT": "Jawa Tengah",
    "ID-JI": "Jawa Timur",
    "ID-BT": "Banten",
    "ID-YO": "DI Yogyakarta",
    "ID-AC": "Aceh",
    "ID-SU": "Sumatera Utara",
    "ID-SB": "Sumatera Barat",
    "ID-RI": "Riau",
    "ID-SS": "Sumatera Selatan",
    "ID-LA": "Lampung",
    "ID-KI": "Kalimantan Timur",
    "ID-KS": "Kalimantan Selatan",
    "ID-KB": "Kalimantan Barat",
    "ID-KT": "Kalimantan Tengah",
    "ID-KU": "Kalimantan Utara",
    "ID-BA": "Bali",
    "ID-NB": "Nusa Tenggara Barat",
    "ID-NT": "Nusa Tenggara Timur",
    "ID-SN": "Sulawesi Selatan",
    "ID-ST": "Sulawesi Tengah",
    "ID-SG": "Sulawesi Tenggara",
    "ID-SA": "Sulawesi Utara",
    "ID-MA": "Maluku",
    "ID-MU": "Maluku Utara",
    "ID-PA": "Papua",
    "ID-PB": "Papua Barat",
    "ID-PD": "Papua Barat Daya",
    "ID-PE": "Papua Pegunungan",
    "ID-PS": "Papua Selatan",
    "ID-PT": "Papua Tengah",
  };

  const provinceCandidates = [
    reverse.principalSubdivisionCode ? provinceAliases[reverse.principalSubdivisionCode] : undefined,
    reverse.principalSubdivision,
    ...admin.filter((item) => item.adminLevel === 3 || item.adminLevel === 4).map((item) => item.name),
  ].filter(Boolean) as string[];

  const cityCandidates = [
    reverse.city,
    reverse.locality,
    ...admin.filter((item) => item.adminLevel && [4, 5, 6].includes(item.adminLevel)).map((item) => item.name),
  ].filter(Boolean) as string[];

  if (!provinceCandidates.length || !cityCandidates.length) {
    throw new Error("Nama kota dari lokasi tidak ditemukan.");
  }

  const provinces = await getProvinces();
  let province: string | undefined;
  for (const candidate of provinceCandidates) {
    province = findRegion(provinces, candidate);
    if (province) break;
  }
  if (!province && provinceCandidates.some((name) => /jakarta/i.test(name))) {
    province = findRegion(provinces, "DKI Jakarta");
  }
  if (!province) throw new Error("Provinsi belum cocok dengan data jadwal shalat.");

  const cities = await getCities(province);
  let city: string | undefined;
  for (const candidate of cityCandidates) {
    city = findRegion(cities, candidate);
    if (city) break;
  }
  if (!city) throw new Error("Kota belum cocok dengan data jadwal shalat. Silakan pilih kota secara manual.");

  const zone = getZoneForProvince(province) || fallbackZone;
  return {
    provinsi: province,
    kabkota: city,
    label: city.replace(/^(Kota|Kab\.|Kabupaten)\s*/i, ""),
    ...zone,
  };
}
