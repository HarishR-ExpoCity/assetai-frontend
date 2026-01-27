FROM debian

SHELL ["/bin/bash", "-c"]
ENV TZ="Asia/Dubai"

ARG USER_ID
ARG USER_NAME
ARG GROUP_ID

# user setup
RUN if [ ${USER_ID:-0} -ne 0 ] && [ ${GROUP_ID:-0} -ne 0 ]; then \
    groupadd -g ${GROUP_ID} ${USER_NAME} &&\
    useradd -l -u ${USER_ID} -g ${USER_NAME} ${USER_NAME} &&\
    install -d -m 0755 -o ${USER_NAME} -g ${USER_NAME} /home/${USER_NAME} &&\
    chown -R ${USER_ID}:${GROUP_ID} /home/${USER_NAME} \
;fi

# install required os modules
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y tzdata vim curl sudo wget git npm

# on start script
USER ${USER_NAME}
WORKDIR /home/${USER_NAME}/code
