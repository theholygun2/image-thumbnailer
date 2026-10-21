import json
from io import BytesIO
from pathlib import Path

import pytest
from PIL import Image

import handler

EVENT_PATH = Path(__file__).parent / "events" / "s3_sqs_event.json"


class FakeS3:
    def __init__(self, objects: dict[str, bytes]):
        self.objects = objects
        self.puts: list[dict] = []

    def get_object(self, Bucket, Key):
        data = self.objects[Key]
        return {"Body": BytesIO(data), "ContentLength": len(data)}

    def put_object(self, **kwargs):
        self.puts.append(kwargs)


def _jpeg(size=(800, 600)) -> bytes:
    buf = BytesIO()
    Image.new("RGB", size, "blue").save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def event() -> dict:
    return json.loads(EVENT_PATH.read_text())


def test_happy_path_writes_thumbnail(monkeypatch, event):
    fake = FakeS3({"uploads/test-id.jpg": _jpeg()})
    monkeypatch.setattr(handler, "s3", fake)

    result = handler.lambda_handler(event)

    assert result == {"batchItemFailures": []}
    assert len(fake.puts) == 1
    put = fake.puts[0]
    assert put["Bucket"] == "my-bucket"
    assert put["Key"] == "thumbnails/test-id.jpg"
    assert put["ContentType"] == "image/jpeg"


def test_bad_image_is_reported_as_batch_failure(monkeypatch, event):
    fake = FakeS3({"uploads/test-id.jpg": b"not an image"})
    monkeypatch.setattr(handler, "s3", fake)

    result = handler.lambda_handler(event)

    assert result == {
        "batchItemFailures": [{"itemIdentifier": "11111111-1111-1111-1111-111111111111"}]
    }
    assert fake.puts == []


def test_s3_test_event_is_ignored(monkeypatch):
    fake = FakeS3({})
    monkeypatch.setattr(handler, "s3", fake)
    event = {"Records": [{"messageId": "m1", "body": json.dumps({"Event": "s3:TestEvent"})}]}

    assert handler.lambda_handler(event) == {"batchItemFailures": []}
    assert fake.puts == []


def test_keys_outside_uploads_are_skipped(monkeypatch, event):
    body = json.loads(event["Records"][0]["body"])
    body["Records"][0]["s3"]["object"]["key"] = "thumbnails/already.jpg"
    event["Records"][0]["body"] = json.dumps(body)
    fake = FakeS3({})
    monkeypatch.setattr(handler, "s3", fake)

    assert handler.lambda_handler(event) == {"batchItemFailures": []}
    assert fake.puts == []


def test_thumbnail_key_for():
    assert handler.thumbnail_key_for("uploads/abc.png") == "thumbnails/abc.jpg"