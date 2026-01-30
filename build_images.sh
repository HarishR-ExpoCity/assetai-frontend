#!/bin/bash

#- Architecture for the Docker image
# ARCH=amd64
ARCH=arm64

#- Set to true if you want to save the docker image to tar file
SAVE_IMAGE=true

echo -e "\033[34mBuilding Docker image...\033[0m"
docker build -f deployment/build/Dockerfile --tag trvision/ui:$ARCH . --no-cache

if [ "$SAVE_IMAGE" = true ]; then
    echo -e "\033[33mSaving Docker image to tar file...\033[0m"
    docker save -o deployment/docker/ui_$ARCH.tar trvision/ui:$ARCH
    echo -e "\033[32mDocker image saved successfully!\033[0m"
fi

echo -e "\033[32mScript completed!\033[0m"