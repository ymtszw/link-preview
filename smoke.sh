#!/bin/bash
# Smoke test for link-preview service
# Usage: ./smoke.sh <endpoint-url>

set -e

ENDPOINT="$1"
TEST_URL="https://cloudflare.com"

if [ -z "$ENDPOINT" ]; then
  echo "Usage: $0 <endpoint-url>"
  echo "  Ex: http://localhost:8787"
  echo "      https://<your-deployed-url>"
  exit 1
fi

RESPONSE=$(curl -s "${ENDPOINT}?q=${TEST_URL}")

TITLE=$(echo "$RESPONSE" | jq -r .title)
URL_OUT=$(echo "$RESPONSE" | jq -r .url)

if [ "$TITLE" != "null" ] && [ "$URL_OUT" != "null" ]; then
  echo "✅ Success: title and url found"
  echo "Title: $TITLE"
  echo "URL: $URL_OUT"
else
  echo "❌ Failed: title or url missing"
  echo "$RESPONSE" | jq .
  exit 2
fi
