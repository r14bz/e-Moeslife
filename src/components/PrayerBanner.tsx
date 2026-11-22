import React, { useEffect, useRef, useState } from "react";
import { Bell, BellOff, MapPin, Compass, X, Volume2, Play, Square } from "lucide-react";
import type { DailyPrayerSchedule, PrayerLocation, SkyScene } from "../types/emoeslife";
import { ThemedSelect } from "./ThemedSelect";
import { PERMISSIONS_READY_EVENT } from "../services/locationService";
import {
  clearBlockedNotificationAudio,
  getNotificationAudioState,
  playNotificationSound,
  stopNotificationAudio,
  subscribeNotificationAudio,
  type NotificationAudioState,
} from "../services/notificationAudio";
import {
  disablePrayerNotifications,
  getPrayerSoundMode,
  isPrayerNotificationsEnabled,
  requestPrayerNotificationPermission,
  setPrayerNotificationsEnabled,
  setPrayerSoundMode,
  syncPrayerNotifications,
  triggerWebPrayerNotificationIfDue,
  type MonthlyBatch,
  type PrayerNotificationSoundMode,
} from "../services/prayerNotifications";
import {
  PRAYER_STORAGE_KEY,
  PRAYERS,
  computePrayerTicker,
  detectLocation,
  findRegion,
  formatHijriDate,
  getCities,
  getProvinces,
  getScene,
  loadMonthlySchedule,
  localParts,
  shouldRetryRefresh,
  timeMinutes,
} from "../utils/prayerEngine";

interface SceneStyle {
  gradient: string;
  isLightSky: boolean;
  scrim: string;
}

const SCENE_STYLES: Record<SkyScene, SceneStyle> = {
  night: {
    gradient:
      "from-[#1b3652] via-[#24496a] to-[#2e5e7d] dark:from-[#102236] dark:via-[#18314c] dark:to-[#214261]",
    isLightSky: false,
    scrim: "from-[#0f2233]/45 via-transparent to-transparent",
  },
  dawn: {
    gradient:
      "from-[#264c61] via-[#406f7d] to-[#be937b] dark:from-[#183144] dark:via-[#294d60] dark:to-[#6e554d]",
    isLightSky: false,
    scrim: "from-[#122634]/40 via-transparent to-transparent",
  },
  sunrise: {
    gradient:
      "from-[#cfe3f2] via-[#f3e1d2] to-[#fce6c8] dark:from-[#1b3752] dark:via-[#2d516c] dark:to-[#665246]",
    isLightSky: true,
    scrim: "from-white/60 via-white/15 to-transparent dark:from-[#0f2233]/50 dark:via-transparent",
  },
  day: {
    gradient:
      "from-[#cae5f3] via-[#e2f1f7] to-[#f7f4ea] dark:from-[#163c57] dark:via-[#1f4f6e] dark:to-[#2a647a]",
    isLightSky: true,
    scrim: "from-white/60 via-white/15 to-transparent dark:from-[#0f2233]/45 dark:via-transparent",
  },
  afternoon: {
    gradient:
      "from-[#c7e0ed] via-[#e8e7da] to-[#f7dfc0] dark:from-[#193852] dark:via-[#264b68] dark:to-[#5e4f42]",
    isLightSky: true,
    scrim: "from-white/60 via-white/15 to-transparent dark:from-[#0f2233]/50 dark:via-transparent",
  },
  sunset: {
    gradient:
      "from-[#2b4266] via-[#685576] to-[#d68c64] dark:from-[#1d2c48] dark:via-[#463b59] dark:to-[#8b5742]",
    isLightSky: false,
    scrim: "from-[#162033]/45 via-transparent to-transparent",
  },
};

const NIGHT_STARS: ReadonlyArray<{ x: number; y: number; r: number; opacity: number; sparkle?: boolean }> = [
  { x: 14, y: 18, r: 1.2, opacity: 0.65 },
  { x: 24, y: 31, r: 0.9, opacity: 0.45 },
  { x: 35, y: 14, r: 1.4, opacity: 0.75, sparkle: true },
  { x: 48, y: 24, r: 1.0, opacity: 0.5 },
  { x: 64, y: 15, r: 1.1, opacity: 0.6 },
  { x: 77, y: 29, r: 1.3, opacity: 0.7, sparkle: true },
  { x: 88, y: 19, r: 0.9, opacity: 0.5 },
  { x: 42, y: 38, r: 0.8, opacity: 0.35 },
];

const CelestialSkyVisual: React.FC<{
  scene: SkyScene;
  coords: { x: number; y: number };
}> = React.memo(({ scene, coords }) => {
  const isNightBody = scene === "night" || scene === "dawn";
  const isWarmSun = scene === "sunrise" || scene === "sunset";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Subtle twinkling-free stars on night / dawn / sunset skies */}
      {(scene === "night" || scene === "dawn" || scene === "sunset") && (
        <svg
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          className={`absolute inset-x-0 top-0 h-[62%] w-full ${
            scene === "night" ? "opacity-90" : "opacity-45"
          }`}
        >
          {NIGHT_STARS.map((star, idx) =>
            star.sparkle ? (
              <path
                key={idx}
                d={`M${star.x} ${star.y - 1.6} L${star.x + 0.45} ${star.y - 0.45} L${star.x + 1.6} ${star.y} L${star.x + 0.45} ${star.y + 0.45} L${star.x} ${star.y + 1.6} L${star.x - 0.45} ${star.y + 0.45} L${star.x - 1.6} ${star.y} L${star.x - 0.45} ${star.y - 0.45} Z`}
                fill="#FFF8DF"
                fillOpacity={star.opacity}
              />
            ) : (
              <circle key={idx} cx={star.x} cy={star.y} r={star.r * 0.45} fill="#FFF8DF" fillOpacity={star.opacity} />
            )
          )}
        </svg>
      )}

      {/* Soft atmospheric clouds for daytime / sunrise / afternoon */}
      {(scene === "day" || scene === "sunrise" || scene === "afternoon") && (
        <svg
          viewBox="0 0 400 140"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-1 h-[55%] w-full opacity-45 dark:opacity-15"
        >
          <path
            d="M42 52c0-7 6-12 13-12 2 0 4 .5 6 1.5C64 34 71 29 80 29c11 0 20 8 21 19 6 1 11 6 11 12 0 7-6 12-13 12H54c-7 0-12-5-12-12Z"
            fill="#FFFFFF"
          />
          <path
            d="M276 40c0-6 5-10 11-10 2 0 4 .5 5.5 1.3C295 25 302 21 310 21c9 0 17 7 18 16 5 1 9 5 9 10 0 6-5 10-11 10h-39c-6 0-11-4-11-10Z"
            fill="#FFFFFF"
          />
        </svg>
      )}

      {/* Sun or Crescent Moon moving naturally across the sky arc */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
      >
        {isNightBody ? (
          <div className="relative flex h-16 w-16 items-center justify-center sm:h-18 sm:w-18">
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,244,205,0.28) 0%, rgba(255,244,205,0.08) 48%, rgba(255,244,205,0) 74%)",
              }}
            />
            <svg viewBox="0 0 64 64" className="relative h-10 w-10 -rotate-12 sm:h-11 sm:w-11">
              <defs>
                <linearGradient id="hilalGrad" x1="14" y1="12" x2="46" y2="52" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFDF5" />
                  <stop offset="58%" stopColor="#F8E7B4" />
                  <stop offset="100%" stopColor="#DFC178" />
                </linearGradient>
                <mask id="hilalMask">
                  <rect width="64" height="64" fill="black" />
                  <circle cx="32" cy="32" r="15" fill="white" />
                  <circle cx="39" cy="27" r="12.5" fill="black" />
                </mask>
              </defs>
              {/* Faint natural earthshine on the shadowed lunar disc */}
              <circle cx="32" cy="32" r="14.5" fill="#F8EBC7" fillOpacity="0.09" />
              {/* Lit crescent moon */}
              <circle cx="32" cy="32" r="15" fill="url(#hilalGrad)" mask="url(#hilalMask)" />
            </svg>
          </div>
        ) : (
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
            {/* Wide soft atmospheric solar halo */}
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: isWarmSun
                  ? "radial-gradient(circle, rgba(255,212,135,0.52) 0%, rgba(246,162,92,0.22) 44%, rgba(246,162,92,0) 74%)"
                  : "radial-gradient(circle, rgba(255,243,190,0.62) 0%, rgba(255,221,126,0.24) 44%, rgba(255,221,126,0) 74%)",
              }}
            />
            <svg viewBox="0 0 64 64" className="relative h-11 w-11 sm:h-12 sm:w-12">
              <defs>
                <radialGradient id={isWarmSun ? "warmSunGrad" : "daySunGrad"} cx="42%" cy="38%" r="60%">
                  <stop offset="0%" stopColor="#FFFDF2" />
                  <stop offset="55%" stopColor={isWarmSun ? "#FFD27D" : "#FFE694"} />
                  <stop offset="100%" stopColor={isWarmSun ? "#E98643" : "#F2B94B"} />
                </radialGradient>
              </defs>
              <circle
                cx="32"
                cy="32"
                r="17"
                fill={isWarmSun ? "#FFD27D" : "#FFE694"}
                fillOpacity="0.28"
              />
              <circle
                cx="32"
                cy="32"
                r="13.5"
                fill={`url(#${isWarmSun ? "warmSunGrad" : "daySunGrad"})`}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
});

const LivePrayerClock: React.FC<{ timezone?: string; className: string }> = React.memo(
  ({ timezone, className }) => {
    const [clockText, setClockText] = useState("--:--:--");

    useEffect(() => {
      const update = () => {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
        const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
        const parts = localParts(new Date(), tz);
        setClockText(`${parts.hour}:${parts.minute}:${parts.second}`);
      };
      update();
      const timer = window.setInterval(update, 1000);
      const onVisibility = () => {
        if (document.visibilityState === "visible") update();
      };
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        window.clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }, [timezone]);

    return <span className={className}>{clockText}</span>;
  }
);

export const PrayerBanner: React.FC = () => {
  const [location, setLocation] = useState<PrayerLocation | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PRAYER_STORAGE_KEY) || "null") as PrayerLocation | null;
      if (saved?.provinsi && saved?.kabkota) return saved;
    } catch {
      // ignore
    }
    return null;
  });

  const [locationStatus, setLocationStatus] = useState<"detecting" | "ready" | "denied" | "error">(() =>
    location ? "ready" : "detecting"
  );
  const [schedule, setSchedule] = useState<DailyPrayerSchedule | null>(null);
  const [dateText, setDateText] = useState("");
  const [hijriDateText, setHijriDateText] = useState("");
  const [statusLabel, setStatusLabel] = useState("Menunggu izin lokasi…");
  const [timeWindowText, setTimeWindowText] = useState("");
  const [inGrace, setInGrace] = useState(false);
  const [activePrayerKey, setActivePrayerKey] = useState<string>("");
  const [scene, setScene] = useState<SkyScene>("day");
  const [celestialCoords, setCelestialCoords] = useState<{ x: number; y: number }>({ x: 52, y: 22 });

  const [modalOpen, setModalOpen] = useState(false);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [draftProvince, setDraftProvince] = useState(location?.provinsi || "");
  const [draftCity, setDraftCity] = useState(location?.kabkota || "");
  const [draftZone, setDraftZone] = useState<"WIB" | "WITA" | "WIT">(location?.zone || "WIB");
  const [dialogError, setDialogError] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => isPrayerNotificationsEnabled());
  const [soundMode, setSoundMode] = useState<PrayerNotificationSoundMode>(() => getPrayerSoundMode());
  const [soundPanelOpen, setSoundPanelOpen] = useState(false);
  const [audioState, setAudioState] = useState<NotificationAudioState>(() => getNotificationAudioState());
  const [notifFeedback, setNotifFeedback] = useState<string>("");

  const locationRef = useRef(location);
  locationRef.current = location;
  const activeDateKeyRef = useRef("");
  const refreshingRef = useRef(false);
  const lastAttemptAtRef = useRef(Number.NaN);
  const monthlyBatchesRef = useRef<MonthlyBatch[]>([]);

  const scheduleAlertsFor = async (targetLoc: PrayerLocation, batches: MonthlyBatch[]) => {
    monthlyBatchesRef.current = batches;
    if (!isPrayerNotificationsEnabled()) return;
    await syncPrayerNotifications(targetLoc, batches);
  };

  const fetchScheduleFor = async (targetLoc: PrayerLocation) => {
    const now = new Date();
    lastAttemptAtRef.current = Date.now();
    const parts = localParts(now, targetLoc.timezone);
    const yearNum = Number(parts.year);
    const monthNum = Number(parts.month);
    const dayNum = Number(parts.day);
    const requestedDateKey = `${parts.year}-${parts.month}-${parts.day}`;
    const data = await loadMonthlySchedule(targetLoc, yearNum, monthNum);
    const daily = data.jadwal.find((item) => Number(item.tanggal) === dayNum);
    if (!daily) throw new Error("Jadwal hari ini belum tersedia.");
    activeDateKeyRef.current = requestedDateKey;
    setSchedule(daily);

    const batches: MonthlyBatch[] = [{ year: yearNum, month: monthNum, jadwal: data.jadwal }];
    if (dayNum >= 25) {
      const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
      const nextYear = monthNum === 12 ? yearNum + 1 : yearNum;
      loadMonthlySchedule(targetLoc, nextYear, nextMonth)
        .then((nextData) => {
          void scheduleAlertsFor(targetLoc, [
            ...batches,
            { year: nextYear, month: nextMonth, jadwal: nextData.jadwal },
          ]);
        })
        .catch(() => {
          void scheduleAlertsFor(targetLoc, batches);
        });
    } else {
      void scheduleAlertsFor(targetLoc, batches);
    }

    return daily;
  };

  const requestGpsLocation = async (mountedCheck?: () => boolean) => {
    setLocationStatus("detecting");
    setStatusLabel("Mendeteksi lokasi Anda…");
    setTimeWindowText("");
    try {
      const detected = await detectLocation();
      if (mountedCheck && !mountedCheck()) return;
      if (locationRef.current?.manual) return;
      const nextLoc: PrayerLocation = { ...detected, detected: true };
      await fetchScheduleFor(nextLoc);
      if (mountedCheck && !mountedCheck()) return;
      setLocation(nextLoc);
      setLocationStatus("ready");
    } catch (err) {
      if (mountedCheck && !mountedCheck()) return;
      setSchedule(null);
      setLocation(null);
      const isDenied =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: number }).code === 1;
      setLocationStatus(isDenied ? "denied" : "error");
      setStatusLabel(isDenied ? "Izin lokasi diperlukan" : "Lokasi belum terdeteksi");
      setTimeWindowText("");
    }
  };

  useEffect(() => {
    let mounted = true;
    const activeLoc = locationRef.current;
    if (activeLoc) {
      fetchScheduleFor(activeLoc)
        .then(() => {
          if (mounted) {
            setLocationStatus("ready");
            setStatusLabel("");
          }
        })
        .catch(() => {
          if (!mounted) return;
          setLocationStatus("error");
          setStatusLabel("Jadwal belum dapat dimuat");
          setTimeWindowText("");
        });
    } else {
      void requestGpsLocation(() => mounted);
    }
    const onPermissionsReady = (event: Event) => {
      if (!mounted) return;
      const detail = (event as CustomEvent<{ locationGranted?: boolean }>).detail;
      if (detail?.locationGranted && !locationRef.current) {
        void requestGpsLocation(() => mounted);
      } else if (locationRef.current && monthlyBatchesRef.current.length > 0) {
        void scheduleAlertsFor(locationRef.current, monthlyBatchesRef.current);
      }
    };
    const onVisibilityChange = () => {
      if (!mounted || document.visibilityState !== "visible") return;
      if (locationRef.current && monthlyBatchesRef.current.length > 0) {
        void scheduleAlertsFor(locationRef.current, monthlyBatchesRef.current);
      }
    };
    window.addEventListener(PERMISSIONS_READY_EVENT, onPermissionsReady);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const unsubscribeAudio = subscribeNotificationAudio((next) => {
      if (mounted) setAudioState(next);
    });

    return () => {
      mounted = false;
      window.removeEventListener(PERMISSIONS_READY_EVENT, onPermissionsReady);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribeAudio();
    };
  }, []);

  const lastRenderedMinuteRef = useRef<string>("");
  const lastFormattedDateKeyRef = useRef<string>("");

  useEffect(() => {
    lastRenderedMinuteRef.current = "";
    lastFormattedDateKeyRef.current = "";

    const updateMinuteState = (force = false) => {
      if (!force && typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      const now = new Date();
      const loc = locationRef.current;
      const tz = loc?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
      const minuteBucket = `${Math.floor(now.getTime() / 60000)}:${tz}`;
      if (!force && lastRenderedMinuteRef.current === minuteBucket) {
        return;
      }
      lastRenderedMinuteRef.current = minuteBucket;

      const parts = localParts(now, tz);
      const tickDateKey = `${parts.year}-${parts.month}-${parts.day}`;
      const dateFormatKey = `${tickDateKey}:${tz}`;
      if (lastFormattedDateKeyRef.current !== dateFormatKey) {
        lastFormattedDateKeyRef.current = dateFormatKey;
        setDateText(
          new Intl.DateTimeFormat("id-ID", {
            timeZone: tz,
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(now)
        );
        setHijriDateText(formatHijriDate(now, tz));
      }

      if (!loc || !schedule) {
        const hourNum = Number(parts.hour);
        const fallbackScene: SkyScene =
          hourNum < 5 || hourNum >= 19
            ? "night"
            : hourNum < 6
            ? "dawn"
            : hourNum < 8
            ? "sunrise"
            : hourNum < 15
            ? "day"
            : hourNum < 18
            ? "afternoon"
            : "sunset";
        setScene((prev) => (prev === fallbackScene ? prev : fallbackScene));
        return;
      }

      if (activeDateKeyRef.current && tickDateKey !== activeDateKeyRef.current) {
        setStatusLabel("Memperbarui jadwal…");
        setTimeWindowText("");
        setInGrace(false);
        if (
          shouldRetryRefresh({
            tickDateKey,
            activeDateKey: activeDateKeyRef.current,
            refreshing: refreshingRef.current,
            lastAttemptAt: lastAttemptAtRef.current,
            now: Date.now(),
          })
        ) {
          refreshingRef.current = true;
          fetchScheduleFor(loc)
            .then(() => setStatusLabel(""))
            .catch(() => setStatusLabel("Jadwal belum dapat dimuat"))
            .finally(() => {
              refreshingRef.current = false;
            });
        }
        return;
      }

      const ticker = computePrayerTicker(
        schedule,
        Number(parts.hour),
        Number(parts.minute)
      );
      setStatusLabel((prev) => (prev === ticker.primaryLabel ? prev : ticker.primaryLabel));
      setTimeWindowText((prev) => (prev === ticker.timeWindowText ? prev : ticker.timeWindowText));
      setInGrace((prev) => (prev === ticker.inGrace ? prev : ticker.inGrace));
      setActivePrayerKey((prev) => (prev === ticker.activePrayerKey ? prev : ticker.activePrayerKey));

      triggerWebPrayerNotificationIfDue(
        loc,
        schedule,
        tickDateKey,
        `${parts.hour}:${parts.minute}`
      );

      const nextScene = getScene(now, loc.timezone, schedule);
      setScene((prev) => (prev === nextScene ? prev : nextScene));

      const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
      const sunrise = timeMinutes(schedule.terbit || "06:00");
      const sunset = timeMinutes(schedule.maghrib || "18:00");
      const isNightArc = nextScene === "night" || nextScene === "dawn";

      let arcProgress: number;
      if (isNightArc) {
        const nightDuration = Math.max(1, 1440 - sunset + sunrise);
        const nightElapsed =
          currentMinutes >= sunset ? currentMinutes - sunset : 1440 - sunset + currentMinutes;
        arcProgress = Math.max(0, Math.min(1, nightElapsed / nightDuration));
      } else {
        arcProgress = Math.max(0, Math.min(1, (currentMinutes - sunrise) / Math.max(1, sunset - sunrise)));
      }

      const nextX = Math.round((26 + arcProgress * 48) * 10) / 10;
      const nextY = Math.round((42 - Math.sin(arcProgress * Math.PI) * 22) * 10) / 10;
      setCelestialCoords((prev) =>
        prev.x === nextX && prev.y === nextY ? prev : { x: nextX, y: nextY }
      );
    };

    updateMinuteState(true);
    const timer = window.setInterval(() => updateMinuteState(false), 1000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") updateMinuteState(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [schedule, location]);

  const openLocationDialog = async () => {
    setModalOpen(true);
    setDialogError("");
    setDraftZone(location?.zone || "WIB");
    if (!provinces.length) {
      setDialogLoading(true);
      try {
        const provList = await getProvinces();
        setProvinces(provList);
        const preferredProv =
          (location?.provinsi ? findRegion(provList, location.provinsi) : undefined) ||
          provList[0] ||
          "";
        setDraftProvince(preferredProv);
        if (preferredProv) {
          const cityList = await getCities(preferredProv);
          setCities(cityList);
          const preferredCity =
            (location?.kabkota ? findRegion(cityList, location.kabkota) : undefined) ||
            cityList[0] ||
            "";
          setDraftCity(preferredCity);
        }
      } catch (err) {
        setDialogError(err instanceof Error ? err.message : "Gagal memuat daftar wilayah.");
      } finally {
        setDialogLoading(false);
      }
    }
  };

  const handleProvinceChange = async (province: string) => {
    setDraftProvince(province);
    setDialogLoading(true);
    setDialogError("");
    try {
      const cityList = await getCities(province);
      setCities(cityList);
      setDraftCity(cityList[0] || "");
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Gagal memuat daftar kota.");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSaveManualLocation = async () => {
    const timezone =
      draftZone === "WITA" ? "Asia/Makassar" : draftZone === "WIT" ? "Asia/Jayapura" : "Asia/Jakarta";
    const nextLoc: PrayerLocation = {
      provinsi: draftProvince,
      kabkota: draftCity,
      label: draftCity.replace(/^(Kota|Kab\.|Kabupaten)\s*/i, ""),
      timezone,
      zone: draftZone,
      manual: true,
    };
    setDialogLoading(true);
    setDialogError("");
    try {
      await fetchScheduleFor(nextLoc);
      setLocation(nextLoc);
      setLocationStatus("ready");
      setStatusLabel("");
      localStorage.setItem(PRAYER_STORAGE_KEY, JSON.stringify(nextLoc));
      setModalOpen(false);
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Gagal memuat jadwal untuk lokasi ini.");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleUseGps = async () => {
    setGpsLoading(true);
    setDialogError("");
    try {
      const detected = await detectLocation();
      const nextLoc: PrayerLocation = { ...detected, detected: true };
      await fetchScheduleFor(nextLoc);
      setLocation(nextLoc);
      setLocationStatus("ready");
      setStatusLabel("");
      localStorage.removeItem(PRAYER_STORAGE_KEY);
      setModalOpen(false);
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Gagal mendeteksi lokasi GPS.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (notifEnabled) {
      await disablePrayerNotifications();
      setNotifEnabled(false);
      setNotifFeedback("Notifikasi waktu shalat dimatikan.");
      window.setTimeout(() => setNotifFeedback(""), 3500);
      return;
    }

    const perm = await requestPrayerNotificationPermission();
    if (perm !== "granted") {
      setNotifEnabled(false);
      setPrayerNotificationsEnabled(false);
      setNotifFeedback("Izin notifikasi belum diaktifkan di perangkat Anda.");
      window.setTimeout(() => setNotifFeedback(""), 4500);
      return;
    }

    setPrayerNotificationsEnabled(true);
    setNotifEnabled(true);
    if (locationRef.current && monthlyBatchesRef.current.length > 0) {
      const res = await syncPrayerNotifications(locationRef.current, monthlyBatchesRef.current);
      setNotifFeedback(
        res.scheduledCount > 0
          ? `Pengingat shalat aktif (${res.scheduledCount} jadwal terdekat).`
          : "Pengingat waktu shalat aktif."
      );
    } else {
      setNotifFeedback("Pengingat waktu shalat diaktifkan.");
    }
    window.setTimeout(() => setNotifFeedback(""), 4000);
  };

  const handleChangeSoundMode = async (mode: PrayerNotificationSoundMode) => {
    setPrayerSoundMode(mode);
    setSoundMode(mode);
    stopNotificationAudio();
    clearBlockedNotificationAudio();
    if (notifEnabled && locationRef.current && monthlyBatchesRef.current.length > 0) {
      await syncPrayerNotifications(locationRef.current, monthlyBatchesRef.current);
    }
    setNotifFeedback(
      mode === "adzan"
        ? "Suara notifikasi shalat diatur ke Suara Adzan."
        : "Suara notifikasi shalat diatur ke Nada Singkat."
    );
    window.setTimeout(() => setNotifFeedback(""), 3500);
  };

  const handleTogglePreviewSound = (kind: "adzan" | "adzan_subuh" | "prayer") => {
    if (audioState.isPlaying && audioState.kind === kind) {
      stopNotificationAudio();
      return;
    }
    void playNotificationSound(kind, {
      label:
        kind === "adzan_subuh"
          ? "Adzan Subuh"
          : kind === "adzan"
          ? "Adzan"
          : "Nada Pengingat",
    });
  };

  const sceneStyle = SCENE_STYLES[scene];
  const isLightSky = sceneStyle.isLightSky;

  return (
    <>
      <section
        className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--theme-border-strong)] bg-gradient-to-br ${sceneStyle.gradient} p-4 shadow-sm sm:p-5 dark:border-[var(--theme-border)] ${
          isLightSky ? "text-[var(--theme-heading)] dark:text-slate-100" : "text-slate-100"
        }`}
        aria-label="Jadwal shalat hari ini"
      >
        {/* Layer 1 (z-0): Natural Sun / Crescent Moon & Sky Atmosphere */}
        <CelestialSkyVisual scene={scene} coords={celestialCoords} />

        {/* Layer 2 (z-[1]): Mosque illustration in FRONT of the sun/moon */}
        <img
          src="/assets/mosque-banner.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[82%] w-full select-none object-contain object-bottom ${
            isLightSky ? "opacity-50 dark:opacity-30" : "opacity-35 dark:opacity-25"
          }`}
        />

        {/* Layer 3 (z-[2]): Subtle contrast scrim for legible typography */}
        <div
          className={`pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t ${sceneStyle.scrim}`}
          aria-hidden="true"
        />

        {/* Layer 4 (z-10): Foreground UI */}
        <div className="relative z-10 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className={`text-[11px] font-semibold tracking-wide ${
                  isLightSky ? "text-[var(--theme-primary)] dark:text-[var(--theme-hero-eyebrow)]" : "text-[#F3D792]"
                }`}
              >
                Jadwal Shalat
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <LivePrayerClock
                  timezone={location?.timezone}
                  className={`font-mono-tabular text-2xl font-semibold tracking-tight sm:text-3xl ${
                    isLightSky ? "text-[#0f3527] dark:text-white" : "text-white"
                  }`}
                />
                <span
                  className={`text-[11px] font-medium ${
                    isLightSky ? "text-[#355245] dark:text-slate-200" : "text-slate-200"
                  }`}
                >
                  {location?.zone || "Lokal"}
                </span>
              </div>
              <p
                className={`mt-0.5 text-xs ${
                  isLightSky ? "text-[#2c4a3d] dark:text-slate-200" : "text-slate-200"
                }`}
              >
                {dateText} ·{" "}
                <span
                  className={`font-semibold ${
                    isLightSky ? "text-[#8a5d14] dark:text-[#F4D99B]" : "text-[#F4D99B]"
                  }`}
                >
                  {location?.label ||
                    (locationStatus === "detecting" ? "Mendeteksi lokasi…" : "Lokasi belum dipilih")}
                </span>
              </p>
              {hijriDateText && (
                <p
                  className={`mt-0.5 text-[11px] font-medium ${
                    isLightSky ? "text-[#174a36] dark:text-[#F4D99B]/90" : "text-[#F4D99B]/95"
                  }`}
                >
                  {hijriDateText}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              {(statusLabel || timeWindowText) && (
                <div className="sm:text-right">
                  {statusLabel && (
                    <p
                      className={`text-xs font-semibold ${
                        inGrace
                          ? isLightSky
                            ? "text-[#8a5d14] dark:text-[#F7DC94]"
                            : "text-[#F7DC94]"
                          : isLightSky
                          ? "text-[#2c4a3d] dark:text-slate-200"
                          : "text-slate-200"
                      }`}
                    >
                      {statusLabel}
                    </p>
                  )}
                  {timeWindowText && (
                    <p
                      className={`font-mono-tabular text-sm font-semibold sm:text-base ${
                        isLightSky ? "text-[var(--theme-heading)] dark:text-[#F4D99B]" : "text-[#F4D99B]"
                      }`}
                    >
                      {timeWindowText}
                    </p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                {!location && locationStatus !== "detecting" && (
                  <button
                    type="button"
                    onClick={() => void requestGpsLocation()}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[var(--theme-primary)] px-2.5 text-[11px] font-semibold text-[var(--theme-primary-text)] shadow-xs transition-colors hover:bg-[var(--theme-primary-hover)]"
                  >
                    <Compass className="h-3 w-3" />
                    <span>Izinkan Lokasi</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleToggleNotifications()}
                  aria-pressed={notifEnabled}
                  aria-label={
                    notifEnabled
                      ? "Matikan notifikasi waktu shalat"
                      : "Aktifkan notifikasi waktu shalat"
                  }
                  title={
                    notifEnabled
                      ? "Notifikasi waktu shalat aktif (ketuk untuk mematikan)"
                      : "Aktifkan notifikasi waktu shalat"
                  }
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold backdrop-blur-sm transition-colors ${
                    notifEnabled
                      ? isLightSky
                        ? "border-[var(--theme-tint-border)] bg-[var(--theme-tint-bg)]/90 text-[var(--theme-tint-text)] hover:bg-[var(--theme-tint-hover)]"
                        : "border-[#F3D792]/50 bg-[#E2B354]/20 text-[#F4D99B] hover:bg-[#E2B354]/30"
                      : isLightSky
                      ? "border-[var(--theme-border-strong)] bg-white/75 text-[var(--theme-nav-muted)] hover:bg-white/95 dark:border-white/25 dark:bg-white/10 dark:text-slate-300"
                      : "border-white/25 bg-white/15 text-white/80 hover:bg-white/25"
                  }`}
                >
                  {notifEnabled ? (
                    <Bell className="h-3 w-3" />
                  ) : (
                    <BellOff className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">
                    {notifEnabled ? "Pengingat Aktif" : "Pengingat Mati"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSoundPanelOpen((prev) => !prev)}
                  aria-expanded={soundPanelOpen}
                  title="Atur & tes suara adzan notifikasi shalat"
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold backdrop-blur-sm transition-colors ${
                    soundPanelOpen || audioState.isPlaying
                      ? isLightSky
                        ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-primary-text)]"
                        : "border-[#F3D792]/80 bg-[#E2B354]/30 text-[#FFF4D2]"
                      : isLightSky
                      ? "border-[var(--theme-border-strong)] bg-white/75 text-[var(--theme-heading)] hover:bg-white/95 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                      : "border-white/25 bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  <Volume2 className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {soundMode === "adzan" ? "Suara Adzan" : "Nada Singkat"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={openLocationDialog}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold backdrop-blur-sm transition-colors ${
                    isLightSky
                      ? "border-[var(--theme-border-strong)] bg-white/75 text-[var(--theme-heading)] hover:bg-white/95 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                      : "border-white/25 bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  <span>{location ? "Ubah lokasi" : "Pilih Kota"}</span>
                </button>
              </div>
            </div>
          </div>

          {audioState.isPlaying && (
            <div
              role="status"
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[11px] backdrop-blur-sm ${
                isLightSky
                  ? "border-[var(--theme-tint-border)] bg-white/85 text-[var(--theme-heading)] dark:border-[#F3D792]/40 dark:bg-slate-900/60 dark:text-[#F4D99B]"
                  : "border-[#F3D792]/50 bg-[#E2B354]/25 text-[#FFF7DE]"
              }`}
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                <span>Mengumandangkan {audioState.label || "Adzan"}…</span>
              </span>
              <button
                type="button"
                onClick={stopNotificationAudio}
                className={`inline-flex min-h-[30px] items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors ${
                  isLightSky
                    ? "bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-primary-hover)]"
                    : "bg-[#F4D99B] text-[#173526] hover:bg-white"
                }`}
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Hentikan</span>
              </button>
            </div>
          )}

          {!audioState.isPlaying && audioState.blocked && audioState.blockedKind && (
            <div
              role="status"
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[11px] backdrop-blur-sm ${
                isLightSky
                  ? "border-[var(--theme-tint-border)] bg-white/85 text-[var(--theme-heading)] dark:border-[#F3D792]/40 dark:bg-slate-900/60 dark:text-[#F4D99B]"
                  : "border-[#F3D792]/50 bg-[#E2B354]/25 text-[#FFF7DE]"
              }`}
            >
              <span className="font-semibold">
                Waktu shalat telah tiba · Putar {audioState.blockedPrayerLabel || "Adzan"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (audioState.blockedKind) {
                      void playNotificationSound(audioState.blockedKind, {
                        label: audioState.blockedPrayerLabel || "Adzan",
                      });
                    }
                  }}
                  className={`inline-flex min-h-[30px] items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors ${
                    isLightSky
                      ? "bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-primary-hover)]"
                      : "bg-[#F4D99B] text-[#173526] hover:bg-white"
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Putar Adzan</span>
                </button>
                <button
                  type="button"
                  onClick={clearBlockedNotificationAudio}
                  aria-label="Tutup"
                  className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-current/20 opacity-80 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {soundPanelOpen && (
            <div
              className={`rounded-xl border p-3 text-xs backdrop-blur-md ${
                isLightSky
                  ? "border-[var(--theme-border-strong)] bg-white/88 text-[var(--theme-ink)] dark:border-white/20 dark:bg-slate-900/75 dark:text-slate-100"
                  : "border-white/20 bg-slate-950/45 text-slate-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">Suara Notifikasi Shalat</p>
                <button
                  type="button"
                  onClick={() => setSoundPanelOpen(false)}
                  aria-label="Tutup pengaturan suara"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-current/15 opacity-75 hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleChangeSoundMode("adzan")}
                  className={`min-h-[34px] rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    soundMode === "adzan"
                      ? isLightSky
                        ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-primary-text)]"
                        : "border-[#F3D792] bg-[#E2B354] text-[#173526]"
                      : "border-current/15 bg-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  Suara Adzan
                </button>
                <button
                  type="button"
                  onClick={() => void handleChangeSoundMode("chime")}
                  className={`min-h-[34px] rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    soundMode === "chime"
                      ? isLightSky
                        ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-primary-text)]"
                        : "border-[#F3D792] bg-[#E2B354] text-[#173526]"
                      : "border-current/15 bg-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  Nada Singkat
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {soundMode === "adzan" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTogglePreviewSound("adzan")}
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-current/20 bg-current/5 px-2.5 text-[11px] font-semibold hover:bg-current/10"
                    >
                      {audioState.isPlaying && audioState.kind === "adzan" ? (
                        <>
                          <Square className="h-3 w-3 fill-current" />
                          <span>Hentikan Adzan</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 fill-current" />
                          <span>Tes Adzan</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePreviewSound("adzan_subuh")}
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-current/20 bg-current/5 px-2.5 text-[11px] font-semibold hover:bg-current/10"
                    >
                      {audioState.isPlaying && audioState.kind === "adzan_subuh" ? (
                        <>
                          <Square className="h-3 w-3 fill-current" />
                          <span>Hentikan Adzan Subuh</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 fill-current" />
                          <span>Tes Adzan Subuh</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTogglePreviewSound("prayer")}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-current/20 bg-current/5 px-2.5 text-[11px] font-semibold hover:bg-current/10"
                  >
                    {audioState.isPlaying && audioState.kind === "prayer" ? (
                      <>
                        <Square className="h-3 w-3 fill-current" />
                        <span>Hentikan</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current" />
                        <span>Tes Nada Singkat</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[10.5px] leading-relaxed opacity-80">
                {soundMode === "adzan"
                  ? "Saat notifikasi waktu shalat tiba, aplikasi memutar suara adzan sungguhan (khusus Subuh memutar Adzan Subuh)."
                  : "Saat notifikasi waktu shalat tiba, aplikasi memutar nada pengingat singkat."}
              </p>
            </div>
          )}

          {notifFeedback && (
            <p
              role="status"
              className={`rounded-xl border px-3 py-1.5 text-[11px] leading-snug backdrop-blur-sm ${
                isLightSky
                  ? "border-[var(--theme-border)] bg-white/80 text-[var(--theme-ink)] dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
                  : "border-white/20 bg-white/10 text-slate-100"
              }`}
            >
              {notifFeedback}
            </p>
          )}

          {!location && locationStatus !== "detecting" && (
            <p
              className={`rounded-xl border px-3 py-2 text-[11px] leading-snug backdrop-blur-sm ${
                isLightSky
                  ? "border-[var(--theme-border)] bg-white/75 text-[var(--theme-ink)] dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
                  : "border-white/20 bg-white/10 text-slate-100"
              }`}
            >
              {locationStatus === "denied"
                ? "Izin lokasi ditolak. Aktifkan lokasi GPS atau pilih kota secara manual untuk menampilkan jadwal shalat daerah Anda."
                : "Lokasi otomatis belum tersedia. Coba izinkan lokasi lagi atau pilih kota secara manual."}
            </p>
          )}

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2" aria-live="polite">
            {PRAYERS.map((prayer) => {
              const isActive = activePrayerKey === String(prayer.key);
              return (
                <div
                  key={String(prayer.key)}
                  className={`flex flex-col items-center rounded-xl border px-1 py-1.5 text-center backdrop-blur-sm transition-colors sm:py-2 ${
                    isActive
                      ? isLightSky
                        ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs dark:border-[var(--theme-accent)] dark:bg-[var(--theme-tint-bg)] dark:text-[var(--theme-heading)]"
                        : "border-[#F3D792]/85 bg-[#E2B354]/30 text-white"
                      : isLightSky
                      ? "border-[var(--theme-border-strong)] bg-white/80 text-[var(--theme-ink)] dark:border-white/20 dark:bg-white/12 dark:text-slate-100"
                      : "border-white/20 bg-white/12 text-white/95"
                  }`}
                >
                  <span
                    className={`text-[10px] font-medium sm:text-[11px] ${
                      isActive
                        ? isLightSky
                          ? "opacity-90"
                          : "text-white/90"
                        : isLightSky
                        ? "text-[var(--theme-muted)] dark:text-slate-200"
                        : "text-slate-100/90"
                    }`}
                  >
                    {prayer.label}
                  </span>
                  <strong
                    className={`font-mono-tabular mt-0.5 text-xs font-semibold sm:text-sm ${
                      isActive
                        ? ""
                        : isLightSky
                        ? "text-[var(--theme-heading)] dark:text-white"
                        : "text-white"
                    }`}
                  >
                    {schedule?.[prayer.key] || "--:--"}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prayerLocationTitle"
            className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5 text-[var(--theme-ink)] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
                  Pengaturan Lokasi
                </p>
                <h3 id="prayerLocationTitle" className="font-display mt-0.5 text-lg font-semibold text-[var(--theme-heading)]">
                  Pilih lokasi jadwal
                </h3>
                <p className="mt-1 text-xs text-[var(--theme-muted)]">
                  Jadwal shalat akan mengikuti kota yang kamu pilih.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup"
                className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] text-[var(--theme-nav-muted)] hover:bg-[var(--theme-tint-bg)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="prayerProvince" className="mb-1 block text-xs font-semibold">
                  Provinsi
                </label>
                <ThemedSelect
                  id="prayerProvince"
                  className="w-full"
                  ariaLabel="Pilih Provinsi"
                  kickerLabel="Pilih Provinsi"
                  placeholder="Memuat provinsi…"
                  value={draftProvince}
                  onChange={(val) => handleProvinceChange(String(val))}
                  disabled={dialogLoading || !provinces.length}
                  options={provinces.map((prov) => ({
                    value: prov,
                    label: prov,
                  }))}
                />
              </div>

              <div>
                <label htmlFor="prayerCity" className="mb-1 block text-xs font-semibold">
                  Kabupaten / Kota
                </label>
                <ThemedSelect
                  id="prayerCity"
                  className="w-full"
                  ariaLabel="Pilih Kabupaten / Kota"
                  kickerLabel="Pilih Kabupaten / Kota"
                  placeholder="Pilih provinsi dahulu"
                  value={draftCity}
                  onChange={(val) => setDraftCity(String(val))}
                  disabled={dialogLoading || !cities.length}
                  options={cities.map((city) => ({
                    value: city,
                    label: city,
                  }))}
                />
              </div>

              <div>
                <label htmlFor="prayerTimezone" className="mb-1 block text-xs font-semibold">
                  Zona waktu
                </label>
                <ThemedSelect
                  id="prayerTimezone"
                  className="w-full"
                  ariaLabel="Pilih Zona Waktu"
                  kickerLabel="Pilih Zona Waktu"
                  value={draftZone}
                  onChange={(val) => setDraftZone(val as "WIB" | "WITA" | "WIT")}
                  options={[
                    { value: "WIB", label: "WIB · UTC+7" },
                    { value: "WITA", label: "WITA · UTC+8" },
                    { value: "WIT", label: "WIT · UTC+9" },
                  ]}
                />
              </div>

              {dialogError && (
                <p role="status" className="text-xs font-medium text-red-600 dark:text-red-400">
                  {dialogError}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveManualLocation}
                  disabled={dialogLoading || !draftCity}
                  className="min-h-[42px] w-full rounded-xl bg-[var(--theme-primary)] px-4 text-xs font-semibold text-[var(--theme-primary-text)] transition-colors hover:bg-[var(--theme-primary-hover)] disabled:opacity-60"
                >
                  {dialogLoading ? "Memuat jadwal…" : "Gunakan lokasi ini"}
                </button>
                <button
                  type="button"
                  onClick={handleUseGps}
                  disabled={gpsLoading}
                  className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-4 text-xs font-semibold text-[var(--theme-nav-muted)] transition-colors hover:bg-[var(--theme-tint-bg)] disabled:opacity-60"
                >
                  <Compass className="h-4 w-4" />
                  <span>{gpsLoading ? "Mendeteksi lokasi…" : "Gunakan lokasi otomatis (GPS)"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
