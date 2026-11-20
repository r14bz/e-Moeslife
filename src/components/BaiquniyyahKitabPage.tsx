import React from "react";
import { baiquniyyahBabs, baiquniyyahBaits } from "../data/baiquniyyah";
import { KitabNadhomReader } from "./KitabNadhomReader";
import { KitabTopBar } from "./KitabTopBar";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface BaiquniyyahKitabPageProps {
  initialBabId?: string;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

export const BaiquniyyahKitabPage: React.FC<BaiquniyyahKitabPageProps> = ({
  initialBabId = "muqaddimah",
  focusMode,
  onToggleFocus,
  onBackToLibrary,
  onGoHome,
}) => {
  return (
    <div style={{ backgroundColor: "var(--tashrif-bg)", minHeight: "100vh" }}>
      <KitabTopBar
        focusMode={focusMode}
        onToggleFocus={onToggleFocus}
        onBackToLibrary={onBackToLibrary}
        onGoHome={onGoHome}
      />

      <KitabNadhomReader
        kitabArab="الْمَنْظُومَةُ الْبَيْقُونِيَّةُ"
        kitabIndo="Kitab Mandhumah Al-Baiquniyyah"
        babs={baiquniyyahBabs}
        baits={baiquniyyahBaits}
        initialBabId={initialBabId}
        selectAriaLabel="Pilih Bab Mandhumah Al-Baiquniyyah"
      />

      <div className="mx-auto max-w-2xl px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default BaiquniyyahKitabPage;
