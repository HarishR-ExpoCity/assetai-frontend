import {
  Configuration,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';

// Get the base app path from environment or default to "/ail/dev"
const baseAppPath = process.env.NEXT_PUBLIC_AIASSET_APP_PATH || '/ail/dev';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || `${baseAppPath}`,
    postLogoutRedirectUri: baseAppPath,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        // Only log errors and warnings to reduce console noise
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          // Commented out to reduce console logs
          // case LogLevel.Info:
          //   console.info(message);
          //   return;
          // case LogLevel.Verbose:
          //   console.debug(message);
          //   return;
        }
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
export const loginRequest = {
  scopes: ['User.Read'],
};
