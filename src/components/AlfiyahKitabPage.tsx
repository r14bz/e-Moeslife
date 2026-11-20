import React from "react";
import { KitabAlfiyahReader } from "./KitabAlfiyahReader";
import { KitabTopBar } from "./KitabTopBar";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface AlfiyahKitabPageProps {
  initialJuz?: number;
  initialBabIndex?: number;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

export const AlfiyahKitabPage: React.FC<AlfiyahKitabPageProps> = ({
  initialJuz = 1,
  initialBabIndex = 0,
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

      <KitabAlfiyahReader initialJuz={initialJuz} initialBabIndex={initialBabIndex} />

      <div className="mx-auto max-w-2xl px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default AlfiyahKitabPage;
