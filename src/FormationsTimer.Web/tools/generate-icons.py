"""Rasterises icons/icon.svg into the PNG sizes the web manifest needs.

Run from the FormationsTimer.Web folder:

    python tools/generate-icons.py

Requires Pillow. Drawing is done at 4x and downsampled, which gives clean
anti-aliased edges without pulling in an SVG renderer.
"""

from pathlib import Path

from PIL import Image, ImageDraw

BASE = 456  # the SVG viewBox
SCALE = 4  # supersampling factor

BG = "#FFFDFC"
PAGE = "#F5EDE2"
CARD_STROKE = "#E7D7C4"
PRIMARY = "#A44A22"
INK_500 = "#6C777B"
INK_900 = "#1C2527"

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "icons"


def draw_icon(draw: ImageDraw.ImageDraw, size: int, corner_radius: int) -> None:
    """Draws the icon artwork onto a `size`x`size` canvas."""
    k = size / BASE

    def s(value: float) -> float:
        return value * k

    def circle(cx: float, cy: float, r: float, fill=None, outline=None, width: float = 0) -> None:
        draw.ellipse(
            [s(cx - r), s(cy - r), s(cx + r), s(cy + r)],
            fill=fill,
            outline=outline,
            width=max(1, round(s(width))) if width else 0,
        )

    def rounded(box, radius, fill=None, outline=None, width: float = 0) -> None:
        draw.rounded_rectangle(
            [s(box[0]), s(box[1]), s(box[2]), s(box[3])],
            radius=s(radius),
            fill=fill,
            outline=outline,
            width=max(1, round(s(width))) if width else 0,
        )

    def hand(x2: float, y2: float, width: float) -> None:
        """A clock hand from the centre with round caps."""
        draw.line([s(228), s(228), s(x2), s(y2)], fill=INK_900, width=max(1, round(s(width))))
        circle(x2, y2, width / 2, fill=INK_900)

    # Plate
    rounded((0, 0, BASE, BASE), corner_radius, fill=BG)

    # Outer ring with its four cardinal markers
    circle(228, 228, 144, outline=PRIMARY, width=24)
    for cx, cy in ((228, 84), (372, 228), (228, 372), (84, 228)):
        circle(cx, cy, 10, fill=PRIMARY)

    # Formation grid
    rounded((138, 138, 318, 318), 42, fill=PAGE, outline=CARD_STROKE, width=8)
    dots = [
        (174, 174, PRIMARY),
        (228, 174, INK_500),
        (282, 174, PRIMARY),
        (174, 228, INK_500),
        (282, 228, INK_500),
        (174, 282, PRIMARY),
        (228, 282, INK_500),
        (282, 282, PRIMARY),
    ]
    for cx, cy, colour in dots:
        circle(cx, cy, 12, fill=colour)

    # Clock hands
    hand(228, 176, 18)
    hand(270, 206, 18)
    circle(228, 228, 18, fill=INK_900)


def render(size: int, corner_radius: int) -> Image.Image:
    canvas = Image.new("RGBA", (size * SCALE, size * SCALE), (0, 0, 0, 0))
    draw_icon(ImageDraw.Draw(canvas), size * SCALE, corner_radius * SCALE)
    return canvas.resize((size, size), Image.LANCZOS)


def render_maskable(size: int) -> Image.Image:
    """Full-bleed background with the artwork inside the 80% safe zone."""
    canvas = Image.new("RGBA", (size, size), BG)
    inner_size = round(size * 0.78)
    inner = render(inner_size, corner_radius=round(BASE * 0.1))
    offset = (size - inner_size) // 2
    canvas.alpha_composite(inner, (offset, offset))
    return canvas


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for size in (192, 512):
        render(size, corner_radius=104).save(OUTPUT_DIR / f"icon-{size}.png")

    render_maskable(512).save(OUTPUT_DIR / "icon-maskable-512.png")

    # iOS applies its own mask, so ship a square opaque icon.
    apple = Image.new("RGB", (180, 180), BG)
    apple.paste(render(180, corner_radius=0), (0, 0), render(180, corner_radius=0))
    apple.save(OUTPUT_DIR / "apple-touch-icon.png")

    print(f"Icons written to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
