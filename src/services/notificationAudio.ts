export type NotificationSoundKind = "prayer" | "update";

const SOUND_PATHS: Record<NotificationSoundKind, string> = {
  prayer: "/assets/sounds/notif_shalat.wav",
  update: "/assets/sounds/notif_update.wav",
};

function playWebAudioFallback(kind: NotificationSoundKind): void {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes =
      kind === "prayer"
        ? [
            { freq: 392.0, offset: 0, dur: 0.45 },
            { freq: 493.88, offset: 0.16, dur: 0.45 },
            { freq: 587.33, offset: 0.32, dur: 0.5 },
            { freq: 783.99, offset: 0.5, dur: 0.7 },
          ]
        : [
            { freq: 587.33, offset: 0, dur: 0.25 },
            { freq: 880.0, offset: 0.14, dur: 0.45 },
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
  } catch {
    // Ignore autoplay/AudioContext blocks cleanly
  }
}

export function playNotificationSound(kind: NotificationSoundKind): void {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio(SOUND_PATHS[kind]);
    audio.volume = 0.85;
    const promise = audio.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {
        playWebAudioFallback(kind);
      });
    }
  } catch {
    playWebAudioFallback(kind);
  }
}
