#!/bin/bash

startTime=$(/bin/date +\%Y/\%m/\%d-\%H:\%M:\%S);
randomNumber=$(/bin/date +\%Y\%m\%d\%H\%M\%S);

export $(grep -v '^#' .env | xargs);

USER_ID=$(id -u ${USER});
USER_NAME=${USER};
GROUP_ID=$(id -g ${USER});
MOUNT_PATH="/home/${USER_NAME}/code";

IMAGE_NAME=${PROJECT_NAME}:${PROJECT_MODE}
docker image build \
    --build-arg=USER_ID=${USER_ID} --build-arg=USER_NAME=${USER_NAME} --build-arg=GROUP_ID=${GROUP_ID} \
    --tag=${IMAGE_NAME} .;
echo "New docker image ${IMAGE_NAME} is created";

echo;
CONTAINER_NAME=${PROJECT_NAME}_${PROJECT_MODE}
docker create \
    --gpus=all \
    --mount="type=bind,source=$(pwd),target=${MOUNT_PATH}" \
    --add-host=host.internal:host-gateway --publish=${APPLICATION_PORT}:3000 \
    --restart=unless-stopped \
    --health-cmd="curl -f http://localhost:3000${APPLICATION_ROOT}/  || exit 1" --health-start-period=30s --health-interval=30s --health-timeout=30s --health-retries=5 \
    --entrypoint=${MOUNT_PATH}/on_start.sh \
    --name=${CONTAINER_NAME} ${IMAGE_NAME};
chmod +x ./on_start.sh;
docker start ${CONTAINER_NAME};
echo "New docker container ${CONTAINER_NAME} is created";

echo;
echo "Started on ${startTime} | Ended on $(/bin/date +\%Y/\%m/\%d-\%H:\%M:\%S)";
echo;
echo;
