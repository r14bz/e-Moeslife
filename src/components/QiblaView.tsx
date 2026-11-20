import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  LocateFixed,
  Navigation,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Smartphone,
} from "lucide-react";
import { getCurrentCoordinates, type GeoCoords } from "../services/locationService";
import {
  calculateDistanceToKaabahKm,
  calculateQiblaBearing,
  getCardinalDirectionId,
  getSignedAngleDelta,
  INDONESIA_QIBLA_PRESETS,
  matchPresetFromLabel,
  normalizeDegrees,
  unwrapRotationAngle,
} from "../services/qiblaEngine";
import { readJsonPreference } from "../services/preferences";
import { PRAYER_STORAGE_KEY } from "../utils/prayerEngine";
import type { PrayerLocation } from "../types/emoeslife";
import { ThemedSelect } from "./ThemedSelect";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface QiblaViewProps {
  onBackHome: () => void;
}

type OrientationEventWithWebkit = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};

type DeviceOrientationStaticWithPerm = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

type SensorState = "checking" | "active" | "needs-permission" | "unavailable";

function getScreenOrientationOffset(): number {
  if (typeof window === "undefined") return 0;
  const angle = window.screen?.orientation?.angle;
  if (typeof angle === "number" && Number.isFinite(angle)) {
    return angle;
  }
  const legacyOrientation = (window as Window & { orientation?: number }).orientation;
  return typeof legacyOrientation === "number" && Number.isFinite(legacyOrientation)
    ? legacyOrientation
    : 0;
}

function resolveInitialLocation(): {
  coords: GeoCoords;
  label: string;
  presetId: string;
} {
  const savedPrayerLoc = readJsonPreference<PrayerLocation | null>(PRAYER_STORAGE_KEY, null);
  if (savedPrayerLoc?.label) {
    const matched = matchPresetFromLabel(savedPrayerLoc.label);
    if (matched) {
      return {
        coords: { latitude: matched.latitude, longitude: matched.longitude },
        label: savedPrayerLoc.label,
        presetId: matched.id,
      };
    }
  }
  const jakarta = INDONESIA_QIBLA_PRESETS[0];
  return {
    coords: { latitude: jakarta.latitude, longitude: jakarta.longitude },
    label: jakarta.label,
    presetId: jakarta.id,
  };
}

export const QiblaView: React.FC<QiblaViewProps> = ({ onBackHome }) => {
  const initialLoc = useMemo(() => resolveInitialLocation(), []);

  const [coords, setCoords] = useState<GeoCoords>(initialLoc.coords);
  const [locationLabel, setLocationLabel] = useState<string>(initialLoc.label);
  const [locationSource, setLocationSource] = useState<"gps" | "preset">("preset");
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialLoc.presetId);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string>("");

  const [sensorState, setSensorState] = useState<SensorState>("checking");
  const [sensorAbsolute, setSensorAbsolute] = useState<boolean>(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [dialRotation, setDialRotation] = useState<number>(0);

  const dialRotationRef = useRef<number>(0);
  const smoothedHeadingRef = useRef<number | null>(null);

  const qiblaBearing = useMemo(() => calculateQiblaBearing(coords), [coords]);
  const distanceKm = useMemo(() => calculateDistanceToKaabahKm(coords), [coords]);
  const cardinal = useMemo(() => getCardinalDirectionId(qiblaBearing), [qiblaBearing]);

  const detectGpsLocation = useCallback(async (userTriggered = false) => {
    setGpsLoading(true);
    if (userTriggered) {
      setGpsMessage("Mengambil koordinat GPS akurat…");
    }
    try {
      const detected = await getCurrentCoordinates({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      });
      setCoords(detected);
      setLocationSource("gps");
      setLocationLabel("Lokasi GPS Perangkat");
      setSelectedPresetId("");
      setGpsMessage("");
    } catch {
      if (userTriggered) {
        setGpsMessage(
          "GPS tidak tersedia atau izin lokasi ditolak. Menggunakan kota acuan yang dipilih."
        );
      }
    } finally {
      setGpsLoading(false);
    }
  }, []);

  useEffect(() => {
    void detectGpsLocation(false);
  }, [detectGpsLocation]);

  const applyHeadingSample = useCallback((rawHeading: number, isAbsolute: boolean) => {
    const normalized = normalizeDegrees(rawHeading);
    const prev = smoothedHeadingRef.current;

    let smoothed = normalized;
    if (prev !== null) {
      const diff = getSignedAngleDelta(normalized, prev);
      // Light smoothing suppresses sensor jitter while staying responsive
      smoothed = normalizeDegrees(prev + diff * 0.32);
    }
    smoothedHeadingRef.current = smoothed;

    const targetDial = normalizeDegrees(-smoothed);
    const nextDial = unwrapRotationAngle(dialRotationRef.current, targetDial);
    dialRotationRef.current = nextDial;

    setDeviceHeading(smoothed);
    setDialRotation(nextDial);
    setSensorAbsolute(isAbsolute);
    setSensorState("active");
  }, []);

  const attachOrientationListeners = useCallback(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setSensorState("unavailable");
      return () => undefined;
    }

    let gotAbsoluteEvent = false;
    let receivedAnyReading = false;

    const handleAbsolute = (event: Event) => {
      const orientEvent = event as OrientationEventWithWebkit;
      if (typeof orientEvent.alpha !== "number" || !Number.isFinite(orientEvent.alpha)) return;
      gotAbsoluteEvent = true;
      receivedAnyReading = true;
      const heading = 360 - orientEvent.alpha + getScreenOrientationOffset();
      applyHeadingSample(heading, true);
    };

    const handleStandard = (event: DeviceOrientationEvent) => {
      const orientEvent = event as OrientationEventWithWebkit;

      // iOS Safari exposes magnetic/true heading directly on webkitCompassHeading
      if (
        typeof orientEvent.webkitCompassHeading === "number" &&
        Number.isFinite(orientEvent.webkitCompassHeading)
      ) {
        receivedAnyReading = true;
        applyHeadingSample(
          orientEvent.webkitCompassHeading + getScreenOrientationOffset(),
          true
        );
        return;
      }

      if (gotAbsoluteEvent) return;
      if (typeof orientEvent.alpha !== "number" || !Number.isFinite(orientEvent.alpha)) return;

      receivedAnyReading = true;
      const heading = 360 - orientEvent.alpha + getScreenOrientationOffset();
      applyHeadingSample(heading, Boolean(orientEvent.absolute));
    };

    window.addEventListener("deviceorientationabsolute", handleAbsolute, true);
    window.addEventListener("deviceorientation", handleStandard, true);

    const fallbackTimer = window.setTimeout(() => {
      if (!receivedAnyReading) {
        setSensorState("unavailable");
      }
    }, 1800);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("deviceorientationabsolute", handleAbsolute, true);
      window.removeEventListener("deviceorientation", handleStandard, true);
    };
  }, [applyHeadingSample]);

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setSensorState("unavailable");
      return undefined;
    }

    const OrientationCtor = window.DeviceOrientationEvent as DeviceOrientationStaticWithPerm;
    if (typeof OrientationCtor.requestPermission === "function") {
      setSensorState("needs-permission");
      return undefined;
    }

    return attachOrientationListeners();
  }, [attachOrientationListeners]);

  const handleRequestCompassPermission = async () => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setSensorState("unavailable");
      return;
    }
    const OrientationCtor = window.DeviceOrientationEvent as DeviceOrientationStaticWithPerm;
    if (typeof OrientationCtor.requestPermission === "function") {
      try {
        const result = await OrientationCtor.requestPermission();
        if (result === "granted") {
          setSensorState("checking");
          attachOrientationListeners();
        } else {
          setSensorState("unavailable");
        }
      } catch {
        setSensorState("unavailable");
      }
    }
  };

  const handlePresetChange = (presetId: string) => {
    const found = INDONESIA_QIBLA_PRESETS.find((item) => item.id === presetId);
    if (!found) return;
    setSelectedPresetId(found.id);
    setCoords({ latitude: found.latitude, longitude: found.longitude });
    setLocationLabel(found.label);
    setLocationSource("preset");
    setGpsMessage("");
  };

  const angleDelta =
    deviceHeading !== null ? getSignedAngleDelta(qiblaBearing, deviceHeading) : null;
  const isAligned = angleDelta !== null && Math.abs(angleDelta) <= 4;

  const citySelectOptions = useMemo(
    () =>
      INDONESIA_QIBLA_PRESETS.map((city) => ({
        value: city.id,
        label: city.label,
      })),
    []
  );

  // Precomputed compass ticks (every 5 degrees, major every 30)
  const compassTicks = useMemo(() => {
    const ticks: Array<{ deg: number; major: boolean; medium: boolean }> = [];
    for (let deg = 0; deg < 360; deg += 5) {
      ticks.push({
        deg,
        major: deg % 30 === 0,
        medium: deg % 15 === 0 && deg % 30 !== 0,
      });
    }
    return ticks;
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 pt-4 pb-8 sm:px-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#dce4df] bg-white px-3.5 text-xs font-semibold text-[#134a35] shadow-xs transition-colors hover:border-[#134a35] hover:bg-[#f4f8f5] dark:border-slate-700 dark:bg-[#111A27] dark:text-[#E2B354] dark:hover:border-[#E2B354]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>Kembali ke Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => void detectGpsLocation(true)}
          disabled={gpsLoading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#134a35] px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0e3928] disabled:opacity-60 dark:bg-[#E2B354] dark:text-[#0B111A] dark:hover:bg-[#d1a444]"
        >
          {gpsLoading ? (
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4 shrink-0" />
          )}
          <span>{gpsLoading ? "Mendeteksi GPS…" : "Deteksi Lokasi GPS"}</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <section className="rounded-3xl border border-[#dce4df] bg-white p-4 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-[#111A27]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#cde2d7] bg-[#ebf5ef] text-[#134a35] dark:border-[#1f4235] dark:bg-[#142b23] dark:text-[#74d6ab]">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                Ibadah Sehari-hari · Penunjuk Kiblat
              </p>
              <h1 className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
                Arah Kiblat Ka’bah
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-[#5e6a62] dark:text-slate-300">
                Menghitung sudut azimuth lingkaran besar menuju Masjidil Haram Makkah serta
                menggunakan kompas perangkat secara langsung bila tersedia.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-[#e2e8e4] bg-[#f7faf8] px-3.5 py-2.5 dark:border-slate-800 dark:bg-[#0D1520]">
            <p className="text-[10px] font-semibold tracking-wider text-[#6d7971] uppercase dark:text-slate-400">
              Lokasi Acuan
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[#103d2c] dark:text-white">
              {locationLabel}
            </p>
            <p className="font-mono-tabular mt-0.5 text-[11px] text-[#5e6a62] dark:text-slate-400">
              {coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}°
              {locationSource === "gps" ? " · GPS" : " · Kota"}
            </p>
          </div>
        </div>

        {gpsMessage && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            {gpsMessage}
          </p>
        )}

        {/* Compass Dial & Guidance Section */}
        <div className="mt-6 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Interactive SVG Compass */}
          <div className="flex flex-col items-center justify-center lg:col-span-6">
            <div className="relative flex w-full max-w-[300px] flex-col items-center sm:max-w-[320px]">
              {/* Top fixed lubber indicator representing the top edge of the phone */}
              <div className="mb-1.5 flex flex-col items-center" aria-hidden="true">
                <span className="text-[10px] font-bold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                  {sensorState === "active" ? "Arah Depan Ponsel" : "Utara Peta (0°)"}
                </span>
                <svg width="16" height="10" viewBox="0 0 16 10" className="mt-0.5">
                  <path
                    d="M8 10L1 1H15L8 10Z"
                    fill={isAligned ? "#16a34a" : "#C5932C"}
                  />
                </svg>
              </div>

              {/* Compass Dial SVG */}
              <div
                className={`relative aspect-square w-full rounded-full p-2 transition-shadow duration-300 ${
                  isAligned
                    ? "ring-4 ring-emerald-500/35 dark:ring-emerald-400/35"
                    : "ring-1 ring-[#dce4df] dark:ring-slate-700"
                }`}
              >
                <svg
                  viewBox="0 0 320 320"
                  className="h-full w-full select-none"
                  role="img"
                  aria-label={`Kompas arah kiblat ${qiblaBearing.toFixed(1)} derajat ${cardinal.label}`}
                >
                  <defs>
                    <radialGradient id="qiblaDialBg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="var(--tashrif-paper, #ffffff)" />
                      <stop offset="100%" stopColor="var(--tashrif-wazan-bg, #f4f7f5)" />
                    </radialGradient>
                  </defs>

                  {/* Base dial circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r="152"
                    fill="url(#qiblaDialBg)"
                    stroke="var(--tashrif-border-strong, #cbd8d0)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="160"
                    cy="160"
                    r="116"
                    fill="none"
                    stroke="var(--tashrif-border-cell, #dce5df)"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />

                  {/* Subtle center alignment crosshair */}
                  <circle
                    cx="160"
                    cy="160"
                    r="28"
                    fill="none"
                    stroke="var(--tashrif-border-cell, #dce5df)"
                    strokeWidth="1"
                  />

                  {/* Rotating Compass Rose + Fixed Qibla Vector on the Rose */}
                  <g
                    style={{
                      transform: `rotate(${sensorState === "active" ? dialRotation : 0}deg)`,
                      transformOrigin: "160px 160px",
                      transition:
                        sensorState === "active"
                          ? "transform 140ms linear"
                          : "transform 300ms ease-out",
                    }}
                  >
                    {/* Degree ticks */}
                    {compassTicks.map((t) => {
                      const innerR = t.major ? 136 : t.medium ? 140 : 144;
                      const outerR = 150;
                      const rad = ((t.deg - 90) * Math.PI) / 180;
                      const x1 = 160 + innerR * Math.cos(rad);
                      const y1 = 160 + innerR * Math.sin(rad);
                      const x2 = 160 + outerR * Math.cos(rad);
                      const y2 = 160 + outerR * Math.sin(rad);
                      return (
                        <line
                          key={t.deg}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={
                            t.deg === 0
                              ? "#dc2626"
                              : t.major
                                ? "var(--tashrif-accent, #134a35)"
                                : "var(--tashrif-muted, #8b968e)"
                          }
                          strokeWidth={t.major ? 2 : 1}
                          strokeOpacity={t.major ? 0.9 : 0.45}
                        />
                      );
                    })}

                    {/* Cardinal labels */}
                    <text
                      x="160"
                      y="38"
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="700"
                      fill="#dc2626"
                    >
                      U
                    </text>
                    <text
                      x="284"
                      y="165"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="var(--tashrif-text, #134a35)"
                    >
                      T
                    </text>
                    <text
                      x="160"
                      y="292"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="var(--tashrif-text, #134a35)"
                    >
                      S
                    </text>
                    <text
                      x="36"
                      y="165"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="var(--tashrif-text, #134a35)"
                    >
                      B
                    </text>

                    {/* Intercardinal hints */}
                    <text
                      x="244"
                      y="79"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="600"
                      fill="var(--tashrif-muted, #6a766e)"
                    >
                      TL
                    </text>
                    <text
                      x="244"
                      y="249"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="600"
                      fill="var(--tashrif-muted, #6a766e)"
                    >
                      TG
                    </text>
                    <text
                      x="76"
                      y="249"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="600"
                      fill="var(--tashrif-muted, #6a766e)"
                    >
                      BD
                    </text>
                    <text
                      x="76"
                      y="79"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="600"
                      fill="var(--tashrif-muted, #6a766e)"
                    >
                      BL
                    </text>

                    {/* Qibla Bearing Vector & Stylized Ka'bah Emblem */}
                    <g
                      style={{
                        transform: `rotate(${qiblaBearing}deg)`,
                        transformOrigin: "160px 160px",
                      }}
                    >
                      {/* Tail counterweight */}
                      <line
                        x1="160"
                        y1="160"
                        x2="160"
                        y2="215"
                        stroke="var(--tashrif-muted, #94a3b8)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeOpacity="0.45"
                      />

                      {/* Active golden/emerald Qibla pointer shaft */}
                      <line
                        x1="160"
                        y1="160"
                        x2="160"
                        y2="68"
                        stroke={isAligned ? "#16a34a" : "#C5932C"}
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                      {/* Arrow head */}
                      <polygon
                        points="160,46 150,68 170,68"
                        fill={isAligned ? "#16a34a" : "#C5932C"}
                      />

                      {/* Ka'bah emblem badge along Qibla vector */}
                      <g transform="translate(148, 86)">
                        <rect
                          x="0"
                          y="0"
                          width="24"
                          height="24"
                          rx="5"
                          fill="#111827"
                          stroke="#E2B354"
                          strokeWidth="1.75"
                        />
                        {/* Kiswah gold band */}
                        <rect x="2" y="6.5" width="20" height="3" fill="#E2B354" />
                        {/* Door detail */}
                        <rect x="10" y="13.5" width="4" height="7" rx="0.7" fill="#E2B354" />
                      </g>
                    </g>
                  </g>

                  {/* Center Pivot */}
                  <circle
                    cx="160"
                    cy="160"
                    r="8"
                    fill={isAligned ? "#16a34a" : "#134a35"}
                    stroke="#E2B354"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Column: Live Guidance + Key Measurements */}
          <div className="space-y-3.5 lg:col-span-6">
            {/* Accessible Direction Status Banner */}
            {sensorState === "active" && angleDelta !== null ? (
              <div
                role="status"
                className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                  isAligned
                    ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700/70 dark:bg-emerald-950/50 dark:text-emerald-100"
                    : "border-[#e6d7b3] bg-[#fdf9ee] text-[#5e4412] dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100"
                }`}
              >
                {isAligned ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : angleDelta > 0 ? (
                  <RotateCw className="mt-0.5 h-5 w-5 shrink-0 text-[#9c7d3c] dark:text-[#E2B354]" />
                ) : (
                  <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-[#9c7d3c] dark:text-[#E2B354]" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {isAligned
                      ? "Arah Sudah Tepat Menghadap Kiblat"
                      : angleDelta > 0
                        ? `Putar ${Math.abs(Math.round(angleDelta))}° ke kanan`
                        : `Putar ${Math.abs(Math.round(angleDelta))}° ke kiri`}
                  </p>
                  <p className="mt-0.5 text-xs opacity-90">
                    {isAligned
                      ? "Sejajarkan posisi shalat Anda mengikuti garis arah atas ponsel."
                      : sensorAbsolute
                        ? "Pegang perangkat datar dan sejajarkan panah Ka'bah dengan penunjuk ▲ di atas."
                        : "Sensor kompas relatif aktif. Gerakkan ponsel membentuk angka 8 untuk mengkalibrasi."}
                  </p>
                </div>
              </div>
            ) : sensorState === "needs-permission" ? (
              <div className="rounded-2xl border border-[#e6d7b3] bg-[#fdf9ee] p-3.5 dark:border-amber-800/60 dark:bg-amber-950/35">
                <p className="text-xs font-semibold text-[#5e4412] dark:text-amber-100">
                  Izin sensor kompas diperlukan
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#71551c] dark:text-amber-200/90">
                  Perangkat iOS/Safari memerlukan konfirmasi untuk mengakses sensor orientasi kompas
                  secara langsung.
                </p>
                <button
                  type="button"
                  onClick={handleRequestCompassPermission}
                  className="mt-2.5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#134a35] px-4 text-xs font-semibold text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                >
                  <Compass className="h-4 w-4" />
                  <span>Aktifkan Kompas Langsung</span>
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-[#dce4df] bg-[#f7faf8] p-3.5 dark:border-slate-800 dark:bg-[#0D1520]">
                <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-[#134a35] dark:text-[#E2B354]" />
                <div>
                  <p className="text-sm font-semibold text-[#103d2c] dark:text-white">
                    Mode Peta Utara-Atas ({qiblaBearing.toFixed(1)}° {cardinal.label})
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#5e6a62] dark:text-slate-300">
                    Sensor magnetometer tidak terdeteksi pada perangkat ini. Gunakan sudut{" "}
                    <strong className="font-mono-tabular text-[#103d2c] dark:text-white">
                      {qiblaBearing.toFixed(1)}°
                    </strong>{" "}
                    dari arah Utara sejati sebagai patokan.
                  </p>
                </div>
              </div>
            )}

            {/* Key Quantitative Readouts */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-[#e2e8e4] bg-[#f8fbf9] p-3.5 dark:border-slate-800 dark:bg-[#0D1520]">
                <p className="text-[11px] font-semibold text-[#6d7971] dark:text-slate-400">
                  Sudut Azimuth Kiblat
                </p>
                <p className="font-mono-tabular mt-1 text-xl font-bold text-[#103d2c] sm:text-2xl dark:text-white">
                  {qiblaBearing.toFixed(1)}°
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#134a35] dark:text-[#E2B354]">
                  {cardinal.label} ({cardinal.short}) dari Utara
                </p>
              </div>

              <div className="rounded-2xl border border-[#e2e8e4] bg-[#f8fbf9] p-3.5 dark:border-slate-800 dark:bg-[#0D1520]">
                <p className="text-[11px] font-semibold text-[#6d7971] dark:text-slate-400">
                  Jarak ke Ka’bah
                </p>
                <p className="font-mono-tabular mt-1 text-xl font-bold text-[#103d2c] sm:text-2xl dark:text-white">
                  {Math.round(distanceKm).toLocaleString("id-ID")} km
                </p>
                <p className="mt-0.5 text-xs text-[#5e6a62] dark:text-slate-300">
                  Masjidil Haram, Makkah
                </p>
              </div>
            </div>

            {deviceHeading !== null && (
              <div className="flex items-center justify-between rounded-2xl border border-[#e2e8e4] bg-white px-3.5 py-2.5 dark:border-slate-800 dark:bg-[#0D1520]">
                <span className="text-xs font-medium text-[#5e6a62] dark:text-slate-300">
                  Arah hadap perangkat saat ini
                </span>
                <span className="font-mono-tabular text-sm font-bold text-[#103d2c] dark:text-[#E2B354]">
                  {Math.round(deviceHeading)}° ({getCardinalDirectionId(deviceHeading).short})
                </span>
              </div>
            )}

            {/* City Fallback Selector */}
            <div className="rounded-2xl border border-[#e2e8e4] bg-white p-3.5 dark:border-slate-800 dark:bg-[#0D1520]">
              <label
                htmlFor="qibla-city-preset"
                className="mb-1.5 block text-xs font-semibold text-[#103d2c] dark:text-white"
              >
                Pilih Kota Acuan Manual (bila tanpa GPS)
              </label>
              <ThemedSelect
                id="qibla-city-preset"
                value={selectedPresetId}
                onChange={handlePresetChange}
                options={citySelectOptions}
                placeholder="Pilih kota di Indonesia…"
                ariaLabel="Pilih kota acuan arah kiblat"
              />
            </div>

            {/* Calibration Tips */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#e8eeea] bg-[#f8fbf9] p-3 text-xs text-[#5e6a62] dark:border-slate-800 dark:bg-[#0D1520] dark:text-slate-300">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#134a35] dark:text-[#E2B354]" />
              <p className="leading-relaxed">
                <strong className="font-semibold text-[#103d2c] dark:text-white">
                  Tips kalibrasi:
                </strong>{" "}
                Letakkan ponsel datar sejajar lantai, jauhkan dari magnet casing atau benda logam,
                dan gerakkan ponsel membentuk pola angka <strong>8</strong> bila jarum terasa
                lambat menyesuaikan arah.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FooterDisclaimer />
    </div>
  );
};
