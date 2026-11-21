import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.emoeslife.app",
  appName: "e-Moeslife",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_emoeslife",
      iconColor: "#009950",
      sound: "adzan.mp3",
    },
  },
};

export default config;
