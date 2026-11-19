import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

export const PERMISSIONS_READY_EVENT = "emoeslife:permissions-ready";

let startupPromptPromise: Promise<void> | null = null;

/**
 * Prompt Android runtime permissions (Location & Notification) when the app opens,
 * sequenced cleanly so Android never drops overlapping system dialogs.
 */
export function requestStartupPermissionsOnLaunch(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return Promise.resolve();
  }
  if (startupPromptPromise) {
    return startupPromptPromise;
  }

  startupPromptPromise = (async () => {
    let locationGranted = false;
    try {
      const current = await Geolocation.checkPermissions();
      if (current.location === "granted" || current.coarseLocation === "granted") {
        locationGranted = true;
      } else if (current.location !== "denied" || current.coarseLocation !== "denied") {
        const requested = await Geolocation.requestPermissions({
          permissions: ["location", "coarseLocation"],
        });
        locationGranted =
          requested.location === "granted" || requested.coarseLocation === "granted";
      }
    } catch {
      // Location services may be off or restricted; UI shows clear manual fallback.
    }

    try {
      const notifStatus = await LocalNotifications.checkPermissions();
      if (notifStatus.display !== "granted" && notifStatus.display !== "denied") {
        await LocalNotifications.requestPermissions();
      }
    } catch {
      // Notification prompt skipped if unavailable on OS version
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(PERMISSIONS_READY_EVENT, { detail: { locationGranted } })
      );
    }
  })();

  return startupPromptPromise;
}

export async function getCurrentCoordinates(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): Promise<GeoCoords> {
  const enableHighAccuracy = options?.enableHighAccuracy ?? false;
  const timeout = options?.timeout ?? 12000;
  const maximumAge = options?.maximumAge ?? 300000;

  if (Capacitor.isNativePlatform()) {
    if (startupPromptPromise) {
      await startupPromptPromise.catch(() => undefined);
    }
    const status = await Geolocation.checkPermissions();
    if (status.location !== "granted" && status.coarseLocation !== "granted") {
      const requested = await Geolocation.requestPermissions({
        permissions: ["location", "coarseLocation"],
      });
      if (requested.location !== "granted" && requested.coarseLocation !== "granted") {
        const err = new Error("Izin lokasi ditolak oleh pengguna.") as Error & { code?: number };
        err.code = 1;
        throw err;
      }
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy,
      timeout,
      maximumAge,
      enableLocationFallback: true,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  }

  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    throw new Error("GPS tidak tersedia.");
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    })
  );

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
