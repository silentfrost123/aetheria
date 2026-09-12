#!/bin/sh
# Aetheria container entrypoint.
#
# Runs as root, ensures the mounted data volume (/app/data) is writable by the
# non-root "app" user, then drops privileges and runs the real command.
#
# Railway (and similar platforms) mount volumes owned by root (uid 0). A
# build-time `chown` cannot see the mount, so ownership must be corrected here,
# at runtime, after the volume is attached. Everything else (node_modules,
# .next, public) is read-only at runtime and can stay root-owned.
set -e

# Correct ownership of the persistent data directory so SQLite can create/write
# aetheria.db (and its -wal/-shm files) as the unprivileged user.
mkdir -p /app/data
chown -R app:app /app/data

# Drop privileges to the unprivileged user and exec the command (gosu forwards
# signals correctly, unlike a bare `su`).
exec gosu app "$@"
