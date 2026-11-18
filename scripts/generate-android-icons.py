#!/usr/bin/env python3
"""Generate Android launcher icons, adaptive foreground/background, and splash screens
for Capacitor from public/assets/app-icon/icon.png.
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ICON_PATH = ROOT / "public" / "assets" / "app-icon" / "icon.png"
RES_DIR = ROOT / "android" / "app" / "src" / "main" / "res"

# Exact brand green from public/assets/app-icon/icon.png
BRAND_GREEN_HEX = "#009950"
BRAND_GREEN_RGBA = (0, 153, 80, 255)

MIPMAP_SIZES = {
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}


def make_round_icon(src: Image.Image, target_px: int) -> Image.Image:
    """Create a smooth circular launcher icon on solid brand green."""
    base_size = 512
    canvas = Image.new("RGBA", (base_size, base_size), BRAND_GREEN_RGBA)

    inner_px = round(base_size * 0.80)
    inner = src.resize((inner_px, inner_px), Image.Resampling.LANCZOS)
    offset = (base_size - inner_px) // 2
    canvas.alpha_composite(inner, (offset, offset))

    # 4x supersampled circular mask for crisp anti-aliased edges
    mask_hi = Image.new("L", (base_size * 4, base_size * 4), 0)
    draw = ImageDraw.Draw(mask_hi)
    draw.ellipse((0, 0, base_size * 4 - 1, base_size * 4 - 1), fill=255)
    mask = mask_hi.resize((base_size, base_size), Image.Resampling.LANCZOS)

    canvas.putalpha(mask)
    return canvas.resize((target_px, target_px), Image.Resampling.LANCZOS)


def make_adaptive_foreground(src: Image.Image, fg_px: int) -> Image.Image:
    """Create 108dp adaptive icon foreground with emblem centered inside 66dp safe zone."""
    canvas = Image.new("RGBA", (fg_px, fg_px), (0, 0, 0, 0))
    inner_px = round(fg_px * 0.70)
    inner = src.resize((inner_px, inner_px), Image.Resampling.LANCZOS)
    offset = (fg_px - inner_px) // 2
    canvas.alpha_composite(inner, (offset, offset))
    return canvas


def main() -> None:
    if not ICON_PATH.is_file():
        raise FileNotFoundError(f"Source icon not found: {ICON_PATH}")
    if not RES_DIR.is_dir():
        raise FileNotFoundError(f"Android res directory not found: {RES_DIR}")

    src = Image.open(ICON_PATH).convert("RGBA")

    for folder, (launcher_px, fg_px) in MIPMAP_SIZES.items():
        out_dir = RES_DIR / folder
        out_dir.mkdir(parents=True, exist_ok=True)

        legacy = src.resize((launcher_px, launcher_px), Image.Resampling.LANCZOS)
        legacy.save(out_dir / "ic_launcher.png", format="PNG")

        round_icon = make_round_icon(src, launcher_px)
        round_icon.save(out_dir / "ic_launcher_round.png", format="PNG")

        foreground = make_adaptive_foreground(src, fg_px)
        foreground.save(out_dir / "ic_launcher_foreground.png", format="PNG")

    values_dir = RES_DIR / "values"
    values_dir.mkdir(parents=True, exist_ok=True)
    bg_xml = values_dir / "ic_launcher_background.xml"
    bg_xml.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        "<resources>\n"
        f'    <color name="ic_launcher_background">{BRAND_GREEN_HEX}</color>\n'
        "</resources>\n",
        encoding="utf-8",
    )

    splash_count = 0
    for splash_path in sorted(RES_DIR.glob("drawable*/splash.png")):
        with Image.open(splash_path) as existing:
            w, h = existing.size
        canvas = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        logo_px = max(96, round(min(w, h) * 0.28))
        logo = src.resize((logo_px, logo_px), Image.Resampling.LANCZOS)
        canvas.alpha_composite(logo, ((w - logo_px) // 2, (h - logo_px) // 2))
        canvas.convert("RGB").save(splash_path, format="PNG")
        splash_count += 1

    print(
        f"Generated Android mipmap icons ({len(MIPMAP_SIZES)} densities) "
        f"and {splash_count} splash screens from {ICON_PATH.name}."
    )


if __name__ == "__main__":
    main()
