# AI-Asset

# Local setup:

# Files or changes required for the local setup:

1. .env 

Create this file in root folder (\CalendulaFacilities) and add the following in it.

#PROJECT
PROJECT_NAME=aiasset
PROJECT_MODE=dev_frontend
APPLICATION_PORT=8006
APPLICATION_ROOT=/ail/dev
APPLICATION_DEBUG=1

2. .env.development

Create this file in root folder (\CalendulaFacilities) and add the following in it.

#AIASSET
AIASSET_BASE_URL=https://futureos.xyz/ail
NEXT_PUBLIC_AIASSET_API_BASE_URL=${AIASSET_BASE_URL}/dev/api
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=e5319a3a-3cfc-49db-b2ce-65e970be4c8e
NEXT_PUBLIC_AZURE_AD_TENANT_ID=d8310f08-1574-471b-8877-43c503225b1a
NEXT_PUBLIC_AZURE_AD_CLIENT_SECRET=~aA8Q~raPpmUVejXm~duBuMynQz2Wl_0OAABXaW1
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:5000/ail/dev/auth/adcallback
NEXT_PUBLIC_REDIRECT_URI=https://futureos.xyz/ail/dev/auth/ms/spa
NEXT_PUBLIC_AIASSET_LOGOUT_REDIRECT_URI=/ail/dev

3. .env.production

Create this file in root folder (\CalendulaFacilities) and add the following in it.

#AIASSET
AIASSET_BASE_URL=https://futureos.xyz/ail
NEXT_PUBLIC_AIASSET_API_BASE_URL=${AIASSET_BASE_URL}/dev/api
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=e5319a3a-3cfc-49db-b2ce-65e970be4c8e
NEXT_PUBLIC_AZURE_AD_TENANT_ID=d8310f08-1574-471b-8877-43c503225b1a
NEXT_PUBLIC_AZURE_AD_CLIENT_SECRET=~aA8Q~raPpmUVejXm~duBuMynQz2Wl_0OAABXaW1
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:5000/ail/dev/auth/adcallback
NEXT_PUBLIC_REDIRECT_URI=https://futureos.xyz/ail/dev/auth/ms/spa
NEXT_PUBLIC_AIASSET_LOGOUT_REDIRECT_URI=/

4. .env.staging

Create this file in root folder (\CalendulaFacilities) and add the following in it.

#AIASSET
AIASSET_BASE_URL=https://futureos.xyz/ail
NEXT_PUBLIC_AIASSET_API_BASE_URL=${AIASSET_BASE_URL}/dev/api
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=e5319a3a-3cfc-49db-b2ce-65e970be4c8e
NEXT_PUBLIC_AZURE_AD_TENANT_ID=d8310f08-1574-471b-8877-43c503225b1a
NEXT_PUBLIC_AZURE_AD_CLIENT_SECRET=~aA8Q~raPpmUVejXm~duBuMynQz2Wl_0OAABXaW1
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:5000/ail/dev/auth/adcallback
NEXT_PUBLIC_REDIRECT_URI=https://futureos.xyz/ail/dev/auth/ms/spa
NEXT_PUBLIC_AIASSET_LOGOUT_REDIRECT_URI=/

5. sftp

Create a folder .vscode in the root (\CalendulaFacilities) 
Create sftp.json file inside .vscode
Add the following code in it.

{
    "name": "sLab local server",
    "host": "futureos.xyz",
    "protocol": "sftp",
    "port": 22,
    "username": "dome",
    "password": "ftdemo@123",
    "remotePath": "/home/dome/Desktop/apps/ai_asset_dev/frontend",
    "uploadOnSave": true,
    "useTempFile": false,
    "openSsh": false
}

6. Verify the code changes in DEV url - https://futureos.xyz/ail/dev/ and make sure the WIFI is connected to EXPOCITY-POC network for the url to work.


