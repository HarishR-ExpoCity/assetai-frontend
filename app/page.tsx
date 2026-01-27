"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import {
  // AccountInfo,
  EventType,
  // AuthenticationResult,
} from "@azure/msal-browser";
import { loginRequest } from "@/components/auth/auth";
import LoginForm from "@/components/auth/LoginForm";
import { useAccessToken } from "@/hooks/useAccessToken";

export default function Home() {
  const router = useRouter();
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [isHandlingAuth, setIsHandlingAuth] = useState(false);
  // Store the account information after successful login
  // const [currentAccount, setCurrentAccount] = useState<AccountInfo | null>(
  //   null
  // );

  const { accessToken, error, tokenExpiration } = useAccessToken();

  const handleAuthentication = useCallback(async () => {
    setIsHandlingAuth(true);
    try {
      // If no redirect to handle, attempt login
      if (!isAuthenticated) {
        const loginResult = await instance.loginPopup(loginRequest);
        if (loginResult) {
          console.log("Login successful", loginResult);
          // setCurrentAccount(loginResult.account);
          router.push("/chat");
        }
      } else {
        router.push("/chat");
      }

      // First, try to handle any existing redirect
      const result = await instance.handleRedirectPromise();

      if (result) {
        console.log("Redirect handled successfully");
        // setCurrentAccount(result.account);
        router.push("/chat");
        return;
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsHandlingAuth(false);
    }
  }, [instance, router, isAuthenticated]);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (
        isAuthenticated &&
        accessToken &&
        tokenExpiration &&
        Date.now() < tokenExpiration
      ) {
        router.push("/chat");
      } else {
        setIsHandlingAuth(false);
      }
    };

    checkAuthAndRedirect();
  }, [isAuthenticated, accessToken, tokenExpiration, router]);

  // Event callback for MSAL
  useEffect(() => {
    const callbackId = instance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS) {
        console.log("Login event successful");
        router.push("/chat");
      } else if (event.eventType === EventType.LOGIN_FAILURE) {
        console.error("Login event failed:", event.error);
        setIsHandlingAuth(false);
      }
    });

    return () => {
      if (callbackId) {
        instance.removeEventCallback(callbackId);
      }
    };
  }, [instance, router]);

  if (isHandlingAuth) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p className="mt-4 text-lg" aria-live="polite">
          Handling authentication...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p className="text-red-500">Authentication error: {error.message}</p>
        <LoginForm onLogin={handleAuthentication} />
      </main>
    );
  }

  return <LoginForm onLogin={handleAuthentication} />;
}
