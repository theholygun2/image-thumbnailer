import os

# handler.py creates a boto3 client at import time. Give boto3 dummy credentials
# so the tests never depend on (or touch) a real AWS setup.
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
os.environ["AWS_DEFAULT_REGION"] = "ap-southeast-1"
os.environ.pop("AWS_SESSION_TOKEN", None)