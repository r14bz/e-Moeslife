import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface NativeCompassReading {
  heading: number;
  accuracy: number;
  absolute: boolean;
}

interface QiblaCompassPluginInterface {
  start(): Promise<{ available: boolean; listening: boolean }>;
  stop(): Promise<void>;
  addListener(
    eventName: "compassReading",
    listenerFunc: (event: NativeCompassReading) => void
  ): Promise<PluginListenerHandle>;
}

const QiblaCompass = registerPlugin<QiblaCompassPluginInterface>("QiblaCompass");

export function isNativeQiblaCompassAvailable(): boolean {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android" &&
    Capacitor.isPluginAvailable("QiblaCompass")
  );
}

export async function startNativeQiblaCompass(
  onReading: (reading: NativeCompassReading) => void
): Promise<{ available: boolean; stop: () => Promise<void> }> {
  if (!isNativeQiblaCompassAvailable()) {
    return {
      available: false,
      stop: async () => undefined,
    };
  }

  let handle: PluginListenerHandle | null = null;
  try {
    handle = await QiblaCompass.addListener("compassReading", onReading);
    const res = await QiblaCompass.start();
    if (!res?.available) {
      await handle.remove().catch(() => undefined);
      return { available: false, stop: async () => undefined };
    }
    return {
      available: true,
      stop: async () => {
        if (handle) {
          await handle.remove().catch(() => undefined);
          handle = null;
        }
        await QiblaCompass.stop().catch(() => undefined);
      },
    };
  } catch {
    if (handle) {
      await handle.remove().catch(() => undefined);
    }
    return {
      available: false,
      stop: async () => undefined,
    };
  }
}
