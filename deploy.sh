#!/bin/bash

# Pull latest code
echo "Pulling lastest code changes..."
git pull origin main

# Build new image
echo "Build new image"
docker compose build app

# Restart caddy if Caddyfile changed
echo "Rebuilding Caddyfile"
docker compose build caddy
docker compose up -d caddy

# Start new container alongside old one
docker compose up -d --no-deps --scale app=2 app

# Wait for new container to start
sleep 5

# Scale back down to 1 (keeps newest, removes old)
docker compose up -d --no-deps --scale app=1 app

echo "Deployment complete!"
