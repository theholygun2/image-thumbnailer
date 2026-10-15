from io import BytesIO

import pytest
from PIL import Image

from thumbnail import make_thumbnail


def _image_bytes(size=(1000, 500), mode="RGB", fmt="JPEG") -> bytes:
    img = Image.new(mode, size, "red")
    buf = BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def _open(data: bytes) -> Image.Image:
    return Image.open(BytesIO(data))


def test_fits_within_max_size_and_keeps_aspect_ratio():
    out = _open(make_thumbnail(_image_bytes((1000, 500))))
    assert out.format == "JPEG"
    assert out.size == (256, 128)


def test_small_images_are_not_upscaled():
    out = _open(make_thumbnail(_image_bytes((100, 80))))
    assert out.size == (100, 80)


def test_png_with_transparency_becomes_jpeg():
    out = _open(make_thumbnail(_image_bytes((400, 400), mode="RGBA", fmt="PNG")))
    assert out.format == "JPEG"
    assert out.mode == "RGB"


def test_webp_is_supported():
    out = _open(make_thumbnail(_image_bytes((600, 600), fmt="WEBP")))
    assert out.size == (256, 256)


def test_garbage_bytes_raise():
    with pytest.raises(Exception):
        make_thumbnail(b"definitely not an image")


def test_unsupported_format_raises():
    with pytest.raises(ValueError):
        make_thumbnail(_image_bytes((50, 50), fmt="GIF"))