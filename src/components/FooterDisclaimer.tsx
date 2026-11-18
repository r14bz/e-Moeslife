import React from "react";

export const WHATSAPP_REPORT_URL =
  "https://wa.me/6289676707976?text=Assalamu%27alaikum.%20Saya%20ingin%20menyampaikan%20laporan%20kesalahan%2C%20kritik%2C%20saran%2C%20atau%20masukan%20untuk%20aplikasi%20e-Moeslife.";

interface FooterDisclaimerProps {
  variant?: "home" | "compact";
}

export const FooterDisclaimer: React.FC<FooterDisclaimerProps> = ({ variant = "home" }) => {
  if (variant === "compact") {
    return (
      <footer className="mx-auto mt-6 max-w-4xl border-t border-[#e2e8e4] px-2 pt-3 pb-4 text-center text-[11px] leading-relaxed text-[#5e6a62] dark:border-slate-800 dark:text-slate-400">
        Mohon bijak dengan tetap merujuk pada mushaf atau kitab asli apabila terdapat kekeliruan
        bacaan, lafadz, atau terjemahan.{" "}
        <a
          href={WHATSAPP_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#16513b] underline underline-offset-2 hover:text-[#0f3a2a] dark:text-[#E2B354] dark:hover:text-[#F0CA7A]"
        >
          Laporkan kesalahan
        </a>
      </footer>
    );
  }

  return (
    <footer className="mx-auto mt-8 max-w-4xl rounded-2xl border border-[#e2e8e4] bg-white px-4 py-4 text-xs leading-relaxed text-[#5e6a62] shadow-xs dark:border-slate-800 dark:bg-[#111A27]/70 dark:text-slate-400">
      <p className="mb-1 text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
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
          className="font-semibold text-[#16513b] underline underline-offset-2 hover:text-[#0f3a2a] dark:text-[#E2B354] dark:hover:text-[#F0CA7A]"
        >
          Hubungi Developer
        </a>
        .
      </p>
    </footer>
  );
};
