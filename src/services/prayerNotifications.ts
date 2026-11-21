import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { DailyPrayerSchedule, PrayerLocation } from "../types/emoeslife";
import { PRAYERS } from "../utils/prayerEngine";
import { playNotificationSound } from "./notificationAudio";

export const PRAYER_NOTIF_STORAGE_KEY = "em-prayer-notif-enabled-v1";
const PRAYER_NOTIF_LAST_FIRED_KEY = "em-prayer-notif-last-fired-v1";
const LEGACY_PRAYER_CHANNEL_ID = "jadwal-shalat";
const PRAYER_CHANNEL_ID = "jadwal-shalat-v2";
const PRAYER_SOUND_RES = "notif_shalat.wav";
const PRAYER_ID_MIN = 510000;
const PRAYER_ID_MAX = 510199;

export function isPrayerNotificationsEnabled(): boolean {
  try {
    const saved = localStorage.getItem(PRAYER_NOTIF_STORAGE_KEY);
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

export function setPrayerNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PRAYER_NOTIF_STORAGE_KEY, String(enabled));
  } catch {
    // ignore storage failures
  }
}

function getZoneOffset(zone: PrayerLocation["zone"]): string {
  if (zone === "WITA") return "+08:00";
  if (zone === "WIT") return "+09:00";
  return "+07:00";
}

function pad2(val: number | string): string {
  return String(val).padStart(2, "0");
}

function parseScheduleDate(
  year: number,
  month: number,
  dayItem: DailyPrayerSchedule,
  timeStr: string,
  zoneOffset: string
): Date | null {
  const cleanTime = String(timeStr || "").trim().slice(0, 5);
  if (!/^\d{1,2}:\d{2}$/.test(cleanTime)) return null;
  const [hh, mm] = cleanTime.split(":").map((n) => pad2(Number(n)));
  const dayNum = Number(dayItem.tanggal);
  if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > 31) return null;

  const iso = `${year}-${pad2(month)}-${pad2(dayNum)}T${hh}:${mm}:00${zoneOffset}`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function ensureChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;
  try {
    await LocalNotifications.deleteChannel({ id: LEGACY_PRAYER_CHANNEL_ID }).catch(() => undefined);
    await LocalNotifications.createChannel({
      id: PRAYER_CHANNEL_ID,
      name: "Pengingat Waktu Shalat",
      description: "Notifikasi bersuara otomatis saat memasuki waktu shalat fardhu",
      importance: 4,
      visibility: 1,
      sound: PRAYER_SOUND_RES,
      vibration: true,
    });
  } catch {
    // Channel may already exist or not be supported on older Android
  }
}

async function cancelScheduledPrayerNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const toCancel = (pending.notifications || [])
      .filter((n) => n.id >= PRAYER_ID_MIN && n.id <= PRAYER_ID_MAX)
      .map((n) => ({ id: n.id }));
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }
  } catch {
    // ignore cleanup failures
  }
}

export async function requestPrayerNotificationPermission(): Promise<"granted" | "denied" | "unsupported"> {
  if (Capacitor.isNativePlatform()) {
    try {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === "granted") return "granted";
      const next = await LocalNotifications.requestPermissions();
      return next.display === "granted" ? "granted" : "denied";
    } catch {
      return "unsupported";
    }
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const res = await Notification.requestPermission();
    return res === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

export async function getPrayerNotificationPermissionState(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.checkPermissions();
      if (res.display === "granted") return "granted";
      if (res.display === "denied") return "denied";
      return "prompt";
    } catch {
      return "unsupported";
    }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "prompt";
}

export interface MonthlyBatch {
  year: number;
  month: number;
  jadwal: DailyPrayerSchedule[];
}

export async function syncPrayerNotifications(
  location: PrayerLocation,
  batches: MonthlyBatch[]
): Promise<{ scheduledCount: number; permission: "granted" | "denied" | "unsupported" }> {
  if (!isPrayerNotificationsEnabled()) {
    await cancelScheduledPrayerNotifications();
    return { scheduledCount: 0, permission: "granted" };
  }

  if (!Capacitor.isNativePlatform()) {
    const perm = await getPrayerNotificationPermissionState();
    return {
      scheduledCount: 0,
      permission: perm === "granted" ? "granted" : perm === "unsupported" ? "unsupported" : "denied",
    };
  }

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== "granted") {
      return { scheduledCount: 0, permission: "denied" };
    }

    await ensureChannel();
    await cancelScheduledPrayerNotifications();

    const zoneOffset = getZoneOffset(location.zone);
    const nowMs = Date.now();
    const horizonMs = nowMs + 7 * 24 * 60 * 60 * 1000;
    const notifications: Array<{
      id: number;
      title: string;
      body: string;
      channelId: string;
      sound: string;
      schedule: { at: Date; allowWhileIdle: boolean };
    }> = [];

    let slotIndex = 0;
    for (const batch of batches) {
      for (const dayItem of batch.jadwal) {
        for (const prayer of PRAYERS) {
          const timeVal = dayItem[prayer.key];
          if (!timeVal) continue;
          const fireAt = parseScheduleDate(
            batch.year,
            batch.month,
            dayItem,
            String(timeVal),
            zoneOffset
          );
          if (!fireAt) continue;
          const fireMs = fireAt.getTime();
          if (fireMs <= nowMs + 1000 || fireMs > horizonMs) continue;

          const hhmm = String(timeVal).trim().slice(0, 5);
          notifications.push({
            id: PRAYER_ID_MIN + slotIndex,
            title: `Masuk Waktu ${prayer.label}`,
            body: `Pukul ${hhmm} ${location.zone} · Wilayah ${location.label}. Mari tunaikan shalat ${prayer.label}.`,
            channelId: PRAYER_CHANNEL_ID,
            sound: PRAYER_SOUND_RES,
            schedule: {
              at: fireAt,
              allowWhileIdle: true,
            },
          });
          slotIndex += 1;
          if (PRAYER_ID_MIN + slotIndex > PRAYER_ID_MAX) break;
        }
        if (PRAYER_ID_MIN + slotIndex > PRAYER_ID_MAX) break;
      }
      if (PRAYER_ID_MIN + slotIndex > PRAYER_ID_MAX) break;
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
    return { scheduledCount: notifications.length, permission: "granted" };
  } catch {
    return { scheduledCount: 0, permission: "unsupported" };
  }
}

export async function disablePrayerNotifications(): Promise<void> {
  setPrayerNotificationsEnabled(false);
  await cancelScheduledPrayerNotifications();
}

export function triggerWebPrayerNotificationIfDue(
  location: PrayerLocation,
  schedule: DailyPrayerSchedule,
  dateKey: string,
  currentHHMM: string
): void {
  if (Capacitor.isNativePlatform()) return;
  if (!isPrayerNotificationsEnabled()) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  for (const prayer of PRAYERS) {
    const prayerTime = String(schedule[prayer.key] || "").trim().slice(0, 5);
    if (!prayerTime || prayerTime !== currentHHMM) continue;

    const fireKey = `${dateKey}:${String(prayer.key)}:${prayerTime}`;
    try {
      if (localStorage.getItem(PRAYER_NOTIF_LAST_FIRED_KEY) === fireKey) return;
      localStorage.setItem(PRAYER_NOTIF_LAST_FIRED_KEY, fireKey);
    } catch {
      // proceed
    }

    const title = `Masuk Waktu ${prayer.label}`;
    const body = `Pukul ${prayerTime} ${location.zone} · Wilayah ${location.label}. Mari tunaikan shalat ${prayer.label}.`;

    playNotificationSound("prayer");

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) =>
          reg.showNotification(title, {
            body,
            icon: "/assets/app-icon/icon.png",
            badge: "/assets/app-icon/icon.png",
            tag: fireKey,
            silent: false,
          })
        )
        .catch(() => {
          new Notification(title, {
            body,
            icon: "/assets/app-icon/icon.png",
            tag: fireKey,
            silent: false,
          });
        });
    } else {
      new Notification(title, {
        body,
        icon: "/assets/app-icon/icon.png",
        tag: fireKey,
        silent: false,
      });
    }
    return;
  }
}
