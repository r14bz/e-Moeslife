import React from "react";
import type { TuratsSlug } from "../utils/turatsLoader";
import { KitabTuratsReader } from "./KitabTuratsReader";
import { KitabTopBar } from "./KitabTopBar";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface TuratsKitabPageProps {
  slug: TuratsSlug;
  initialBabIndex?: number;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

export const TuratsKitabPage: React.FC<TuratsKitabPageProps> = ({
  slug,
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

      <KitabTuratsReader slug={slug} initialBabIndex={initialBabIndex} />

      <div className="mx-auto max-w-2xl px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default TuratsKitabPage;
