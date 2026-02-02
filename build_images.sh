#!/bin/bash

set -euo pipefail

#- Architecture for the Docker image (override with ARCH env var)
ARCH="${ARCH:-arm64}"

#- Set to true if you want to save the docker image to tar file (override with SAVE_IMAGE env var)
SAVE_IMAGE="${SAVE_IMAGE:-true}"

echo -e "\033[34mBuilding Docker image...\033[0m"
docker build -f deployment/build/Dockerfile --tag assetai/ui:$ARCH . --no-cache

if [ "$SAVE_IMAGE" = true ]; then
    echo -e "\033[33mSaving Docker image to tar file...\033[0m"
    mkdir -p deployment/docker
    docker save -o deployment/docker/ui_$ARCH.tar assetai/ui:$ARCH
    echo -e "\033[32mDocker image saved successfully!\033[0m"
fi

echo -e "\033[32mScript completed!\033[0m"