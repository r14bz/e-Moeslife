import React from "react";
import { aqidatulAwamBabs, aqidatulAwamBaits } from "../data/aqidatulAwam";
import { KitabNadhomReader } from "./KitabNadhomReader";
import { KitabTopBar } from "./KitabTopBar";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface AqidatulAwamKitabPageProps {
  initialBabId?: string;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

export const AqidatulAwamKitabPage: React.FC<AqidatulAwamKitabPageProps> = ({
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
        kitabArab="عَقِيدَةُ الْعَوَامِ"
        kitabIndo="Kitab Nadhom Aqidatul Awam"
        babs={aqidatulAwamBabs}
        baits={aqidatulAwamBaits}
        initialBabId={initialBabId}
        selectAriaLabel="Pilih Bab Nadhom Aqidatul Awam"
      />

      <div className="mx-auto max-w-2xl px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default AqidatulAwamKitabPage;
