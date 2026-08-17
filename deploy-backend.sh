#!/bin/bash
set -e

ACR_NAME="acrcravodevops"
IMAGE="acrcravodevops.azurecr.io/cravo-backend:latest"
CONTAINER="cravo-backend"
NETWORK="cravo-net"

echo "=== Azure Managed Identity Login ==="
az login --identity --allow-no-subscriptions

echo "=== ACR Login ==="
az acr login --name "$ACR_NAME"

echo "=== Pull Latest Backend Image ==="
docker pull "$IMAGE"

echo "=== Stop Existing Backend ==="
docker stop "$CONTAINER" 2>/dev/null || true

echo "=== Remove Existing Backend ==="
docker rm "$CONTAINER" 2>/dev/null || true

echo "=== Start New Backend ==="
docker run -d \
  --name "$CONTAINER" \
  --network "$NETWORK" \
  --restart unless-stopped \
  -p 5000:5000 \
  "$IMAGE"

echo "=== Verify Container ==="
docker ps --filter "name=$CONTAINER"

echo "=== Wait For Backend ==="
sleep 5

echo "=== Backend Health Check ==="

if curl -fsS http://localhost:5000/api/restaurants > /dev/null; then
    echo "BACKEND_DEPLOYMENT_SUCCESS"
    echo "=== Container Logs ==="
    docker logs "$CONTAINER" --tail 50
else
    echo "BACKEND_DEPLOYMENT_FAILED"
    echo "=== Container Logs ==="
    docker logs "$CONTAINER" --tail 100
    exit 1
fi