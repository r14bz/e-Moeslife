import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type ApkDownloadStage =
  | "connecting"
  | "downloading"
  | "ready"
  | "permission";

export interface ApkDownloadProgressEvent {
  stage: ApkDownloadStage;
  downloadedBytes: number;
  totalBytes: number;
  percent: number;
}

export interface ApkInstallResult {
  status: "installing" | "permission_denied";
  fileReady?: boolean;
}

interface NativeApkInstallerPlugin {
  canRequestPackageInstalls(): Promise<{ granted: boolean }>;
  downloadAndInstall(options: { url: string }): Promise<ApkInstallResult>;
  installCachedApk(): Promise<ApkInstallResult>;
  markVersionNotified(options: { versionCode: number }): Promise<void>;
  consumePendingUpdateOpen(): Promise<{ pending: boolean }>;
  addListener(
    eventName: "downloadProgress",
    listenerFunc: (event: ApkDownloadProgressEvent) => void
  ): Promise<PluginListenerHandle>;
}

const ApkInstaller = registerPlugin<NativeApkInstallerPlugin>("ApkInstaller");

export function isInAppApkInstallerAvailable(): boolean {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android" &&
    Capacitor.isPluginAvailable("ApkInstaller")
  );
}

export async function downloadAndInstallApk(
  url: string,
  onProgress?: (event: ApkDownloadProgressEvent) => void
): Promise<ApkInstallResult> {
  let listenerHandle: PluginListenerHandle | null = null;
  if (onProgress) {
    listenerHandle = await ApkInstaller.addListener("downloadProgress", onProgress);
  }
  try {
    return await ApkInstaller.downloadAndInstall({ url });
  } finally {
    if (listenerHandle) {
      await listenerHandle.remove().catch(() => undefined);
    }
  }
}

export async function installCachedApk(): Promise<ApkInstallResult> {
  return ApkInstaller.installCachedApk();
}

export async function markNativeVersionNotified(versionCode: number): Promise<void> {
  if (!isInAppApkInstallerAvailable() || versionCode <= 0) return;
  try {
    await ApkInstaller.markVersionNotified({ versionCode });
  } catch {
    // Ignore if older native binary does not expose method
  }
}

export async function consumePendingNativeUpdateOpen(): Promise<boolean> {
  if (!isInAppApkInstallerAvailable()) return false;
  try {
    const res = await ApkInstaller.consumePendingUpdateOpen();
    return Boolean(res?.pending);
  } catch {
    return false;
  }
}
