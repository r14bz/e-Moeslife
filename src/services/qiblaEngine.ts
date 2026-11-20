import type { GeoCoords } from "./locationService";

export const KAABAH_COORDS: Readonly<GeoCoords> = {
  latitude: 21.422487,
  longitude: 39.826206,
};

const EARTH_RADIUS_KM = 6371.0088;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Great-circle forward azimuth clockwise from True North (0°–360°)
 * from the given coordinates toward the Ka'bah in Makkah.
 */
export function calculateQiblaBearing(coords: GeoCoords): number {
  const lat1 = toRadians(coords.latitude);
  const lon1 = toRadians(coords.longitude);
  const lat2 = toRadians(KAABAH_COORDS.latitude);
  const lon2 = toRadians(KAABAH_COORDS.longitude);

  const deltaLon = lon2 - lon1;
  const y = Math.sin(deltaLon);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLon);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

/**
 * Haversine great-circle distance to the Ka'bah in kilometers.
 */
export function calculateDistanceToKaabahKm(coords: GeoCoords): number {
  const lat1 = toRadians(coords.latitude);
  const lat2 = toRadians(KAABAH_COORDS.latitude);
  const dLat = lat2 - lat1;
  const dLon = toRadians(KAABAH_COORDS.longitude - coords.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Signed angular difference from deviceHeading to targetBearing in (-180, 180].
 * Positive = turn clockwise (right); Negative = turn counter-clockwise (left).
 */
export function getSignedAngleDelta(targetBearing: number, deviceHeading: number): number {
  return (((targetBearing - deviceHeading + 540) % 360) - 180);
}

/**
 * Unwraps a target rotation degree relative to a previous continuous rotation
 * so CSS transforms never jump across the 0°/360° boundary.
 */
export function unwrapRotationAngle(previousAngle: number, nextNormalizedAngle: number): number {
  const delta = (((nextNormalizedAngle - previousAngle + 540) % 360) - 180);
  return previousAngle + delta;
}

export function getCardinalDirectionId(deg: number): { short: string; label: string } {
  const norm = normalizeDegrees(deg);
  const directions: ReadonlyArray<{ short: string; label: string }> = [
    { short: "U", label: "Utara" },
    { short: "TL", label: "Timur Laut" },
    { short: "T", label: "Timur" },
    { short: "TG", label: "Tenggara" },
    { short: "S", label: "Selatan" },
    { short: "BD", label: "Barat Daya" },
    { short: "B", label: "Barat" },
    { short: "BL", label: "Barat Laut" },
  ];
  const index = Math.round(norm / 45) % 8;
  return directions[index];
}

export interface CityQiblaPreset {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

export const INDONESIA_QIBLA_PRESETS: ReadonlyArray<CityQiblaPreset> = [
  { id: "jakarta", label: "DKI Jakarta", latitude: -6.2088, longitude: 106.8456 },
  { id: "bandung", label: "Kota Bandung, Jawa Barat", latitude: -6.9175, longitude: 107.6191 },
  { id: "bogor", label: "Kota Bogor, Jawa Barat", latitude: -6.5971, longitude: 106.806 },
  { id: "semarang", label: "Kota Semarang, Jawa Tengah", latitude: -6.9667, longitude: 110.4167 },
  { id: "yogyakarta", label: "D.I. Yogyakarta", latitude: -7.7956, longitude: 110.3695 },
  { id: "surabaya", label: "Kota Surabaya, Jawa Timur", latitude: -7.2575, longitude: 112.7521 },
  { id: "malang", label: "Kota Malang, Jawa Timur", latitude: -7.9666, longitude: 112.6326 },
  { id: "serang", label: "Kota Serang, Banten", latitude: -6.1204, longitude: 106.1503 },
  { id: "banda-aceh", label: "Banda Aceh, Aceh", latitude: 5.5483, longitude: 95.3238 },
  { id: "medan", label: "Kota Medan, Sumatera Utara", latitude: 3.5952, longitude: 98.6722 },
  { id: "padang", label: "Kota Padang, Sumatera Barat", latitude: -0.9471, longitude: 100.4172 },
  { id: "pekanbaru", label: "Kota Pekanbaru, Riau", latitude: 0.5071, longitude: 101.4478 },
  { id: "palembang", label: "Kota Palembang, Sumsel", latitude: -2.9761, longitude: 104.7754 },
  { id: "lampung", label: "Bandar Lampung, Lampung", latitude: -5.4292, longitude: 105.261 },
  { id: "pontianak", label: "Kota Pontianak, Kalbar", latitude: -0.0263, longitude: 109.3425 },
  { id: "banjarmasin", label: "Kota Banjarmasin, Kalsel", latitude: -3.3194, longitude: 114.5908 },
  { id: "balikpapan", label: "Kota Balikpapan, Kaltim", latitude: -1.2379, longitude: 116.8529 },
  { id: "denpasar", label: "Kota Denpasar, Bali", latitude: -8.6705, longitude: 115.2126 },
  { id: "mataram", label: "Kota Mataram, NTB", latitude: -8.5833, longitude: 116.1167 },
  { id: "makassar", label: "Kota Makassar, Sulsel", latitude: -5.1477, longitude: 119.4327 },
  { id: "manado", label: "Kota Manado, Sulut", latitude: 1.4748, longitude: 124.8421 },
  { id: "ambon", label: "Kota Ambon, Maluku", latitude: -3.6954, longitude: 128.1814 },
  { id: "jayapura", label: "Kota Jayapura, Papua", latitude: -2.5916, longitude: 140.669 },
];

export function matchPresetFromLabel(label: string): CityQiblaPreset | null {
  const clean = label.toLocaleLowerCase("id");
  if (!clean) return null;
  for (const preset of INDONESIA_QIBLA_PRESETS) {
    const cityKeyword = preset.label.split(",")[0].replace(/^Kota\s+/i, "").trim().toLowerCase();
    if (clean.includes(cityKeyword)) {
      return preset;
    }
  }
  return null;
}
