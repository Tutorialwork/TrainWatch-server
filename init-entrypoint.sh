#!/bin/sh

export DB_API_KEY="$(cat /run/secrets/IST_MEIN_ZUG_PUENKTLICH_DB_API_KEY)"
export DB_CLIENT_ID="$(cat /run/secrets/IST_MEIN_ZUG_PUENKTLICH_DB_CLIENT_ID)"

exec "$@"
