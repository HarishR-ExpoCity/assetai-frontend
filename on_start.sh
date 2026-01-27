#!/bin/sh
 
export $(grep -v '^#' .env | xargs);
cd ~/code;
 
npm install;
npm run build;
 
if [ "${APPLICATION_DEBUG}" = "0" ]; then
    export NODE_ENV=production;
    npm run start;
else
    npm run dev;
fi