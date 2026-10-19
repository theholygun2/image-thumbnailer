#!/bin/bash
# Runs once, as root, on first boot. Log: /var/log/cloud-init-output.log
set -euxo pipefail

dnf install -y docker git
systemctl enable --now docker

ARCH=$(uname -m)   # x86_64 or aarch64
case "$ARCH" in
  x86_64)  BUILDX_ARCH=amd64 ;;
  aarch64) BUILDX_ARCH=arm64 ;;
esac

# Docker Compose and buildx plugins (not included in Amazon Linux's docker package).
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${ARCH}" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
curl -SL "https://github.com/docker/buildx/releases/download/v0.19.3/buildx-v0.19.3.linux-${BUILDX_ARCH}" \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/*