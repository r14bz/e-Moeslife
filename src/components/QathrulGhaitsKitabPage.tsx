import React from "react";
import { KitabQathrulGhaitsReader } from "./KitabQathrulGhaitsReader";
import { KitabTopBar } from "./KitabTopBar";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface QathrulGhaitsKitabPageProps {
  initialIndex?: number;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

export const QathrulGhaitsKitabPage: React.FC<QathrulGhaitsKitabPageProps> = ({
  initialIndex = 0,
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

      <KitabQathrulGhaitsReader initialIndex={initialIndex} />

      <div className="mx-auto max-w-2xl px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default QathrulGhaitsKitabPage;
