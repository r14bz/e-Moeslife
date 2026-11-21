import React from "react";
import { KitabTijanDaroriReader } from "./KitabTijanDaroriReader";
import { KitabTopBar } from "./KitabTopBar";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface TijanDaroriKitabPageProps {
  initialBabId?: string;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

export const TijanDaroriKitabPage: React.FC<TijanDaroriKitabPageProps> = ({
  initialBabId,
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

      <KitabTijanDaroriReader initialBabId={initialBabId} />

      <div className="mx-auto max-w-2xl px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default TijanDaroriKitabPage;
