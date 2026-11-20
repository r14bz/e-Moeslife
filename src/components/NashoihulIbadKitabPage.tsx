import React from "react";
import { KitabNashoihulIbadReader } from "./KitabNashoihulIbadReader";
import { KitabTopBar } from "./KitabTopBar";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface NashoihulIbadKitabPageProps {
  initialBabId?: string;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

export const NashoihulIbadKitabPage: React.FC<NashoihulIbadKitabPageProps> = ({
  initialBabId = "bab-1",
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

      <KitabNashoihulIbadReader initialBabId={initialBabId} />

      <div className="mx-auto max-w-2xl px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default NashoihulIbadKitabPage;
