import React from "react";

export const WHATSAPP_REPORT_URL =
  "https://wa.me/6289676707976?text=Assalamu%27alaikum.%20Saya%20ingin%20menyampaikan%20laporan%20kesalahan%2C%20kritik%2C%20saran%2C%20atau%20masukan%20untuk%20aplikasi%20e-Moeslife.";

interface FooterDisclaimerProps {
  variant?: "home" | "compact";
}

export const FooterDisclaimer: React.FC<FooterDisclaimerProps> = ({ variant = "home" }) => {
  if (variant === "compact") {
    return (
      <footer className="mx-auto mt-6 max-w-4xl border-t border-[var(--theme-border)] px-2 pt-3 pb-4 text-center text-[11px] leading-relaxed text-[var(--theme-muted)]">
        Mohon bijak dengan tetap merujuk pada mushaf atau kitab asli apabila terdapat kekeliruan
        bacaan, lafadz, atau terjemahan.{" "}
        <a
          href={WHATSAPP_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--theme-link)] underline underline-offset-2 hover:text-[var(--theme-link-hover)]"
        >
          Laporkan kesalahan
        </a>
      </footer>
    );
  }

  return (
    <footer className="mx-auto mt-8 max-w-4xl rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-4 text-xs leading-relaxed text-[var(--theme-muted)] shadow-xs">
      <p className="mb-1 text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
        Catatan & Rujukan
      </p>
      <p>
        Mohon bijak untuk tetap merujuk pada kitab atau mushaf asli sebagai pegangan utama, karena
        masih mungkin terdapat kekeliruan pada bacaan, lafadz, maupun terjemahan. Temukan
        kesalahan teks atau punya masukan?{" "}
        <a
          href={WHATSAPP_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--theme-link)] underline underline-offset-2 hover:text-[var(--theme-link-hover)]"
        >
          Hubungi Developer
        </a>
        .
      </p>
    </footer>
  );
};
