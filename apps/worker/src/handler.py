"""Lambda entry point: SQS message -> S3 event -> thumbnail written back to S3."""

import json
import logging
import urllib.parse

import boto3

from thumbnail import make_thumbnail

logger = logging.getLogger()
logger.setLevel(logging.INFO)

UPLOAD_PREFIX = "uploads/"
THUMBNAIL_PREFIX = "thumbnails/"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # mirrors the API's presigned POST limit

s3 = boto3.client("s3")


def thumbnail_key_for(upload_key: str) -> str:
    """uploads/<id>.png -> thumbnails/<id>.jpg"""
    name = upload_key[len(UPLOAD_PREFIX):]
    stem = name.rsplit(".", 1)[0]
    return f"{THUMBNAIL_PREFIX}{stem}.jpg"


def process_s3_record(s3_record: dict) -> None:
    bucket = s3_record["s3"]["bucket"]["name"]
    # Keys in S3 events are URL-encoded (spaces become '+', etc.).
    key = urllib.parse.unquote_plus(s3_record["s3"]["object"]["key"])

    if not key.startswith(UPLOAD_PREFIX):
        logger.info("Skipping key outside %s: %s", UPLOAD_PREFIX, key)
        return

    obj = s3.get_object(Bucket=bucket, Key=key)
    if obj["ContentLength"] > MAX_UPLOAD_BYTES:
        raise ValueError(f"{key} is {obj['ContentLength']} bytes, over the limit")

    thumbnail = make_thumbnail(obj["Body"].read())
    out_key = thumbnail_key_for(key)

    # Same key every time, so reprocessing a message is safe (idempotent).
    s3.put_object(Bucket=bucket, Key=out_key, Body=thumbnail, ContentType="image/jpeg")
    logger.info("Wrote %s (%d bytes)", out_key, len(thumbnail))


def process_sqs_record(sqs_record: dict) -> None:
    body = json.loads(sqs_record["body"])
    # S3 sends an "s3:TestEvent" (no Records) when a notification is first configured.
    for s3_record in body.get("Records", []):
        process_s3_record(s3_record)


def lambda_handler(event: dict, context=None) -> dict:
    """Needs ReportBatchItemFailures enabled on the SQS event source mapping."""
    failures = []
    for record in event["Records"]:
        try:
            process_sqs_record(record)
        except Exception:
            logger.exception("Failed message %s", record.get("messageId"))
            failures.append({"itemIdentifier": record["messageId"]})
    return {"batchItemFailures": failures}