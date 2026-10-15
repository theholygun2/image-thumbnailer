"""Pure image logic: bytes in, JPEG thumbnail bytes out. No AWS here."""

from io import BytesIO

from PIL import Image, ImageOps

# Pillow warns above this many pixels and raises above 2x (decompression bomb guard).
Image.MAX_IMAGE_PIXELS = 40_000_000

MAX_SIZE = (256, 256)
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def make_thumbnail(data: bytes, max_size: tuple[int, int] = MAX_SIZE, quality: int = 85) -> bytes:
    """Return a JPEG thumbnail that fits within max_size, aspect ratio preserved."""
    with Image.open(BytesIO(data)) as img:
        # Check the real format, not the file extension (which can be spoofed).
        if img.format not in ALLOWED_FORMATS:
            raise ValueError(f"Unsupported image format: {img.format}")

        img = ImageOps.exif_transpose(img)  # apply camera rotation
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        img = _to_rgb(img)

        out = BytesIO()
        # Saving without exif=... strips metadata (GPS, camera info, etc.).
        img.save(out, format="JPEG", quality=quality, optimize=True)
        return out.getvalue()


def _to_rgb(img: Image.Image) -> Image.Image:
    """JPEG has no alpha channel, so flatten transparency onto white."""
    if img.mode == "RGB":
        return img
    if img.mode in ("RGBA", "LA", "P"):
        rgba = img.convert("RGBA")
        background = Image.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.split()[-1])
        return background
    return img.convert("RGB")