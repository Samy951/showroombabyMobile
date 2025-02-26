import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { useAuth } from "../src/hooks/useAuth";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function useProtectedRoute(isAuthenticated: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";

    console.log("État de navigation détaillé:", {
      isAuthenticated,
      inAuthGroup,
      inTabsGroup,
      segments,
      currentPath: segments.join("/"),
    });

    if (!isAuthenticated && !inAuthGroup) {
      console.log("Redirection vers login - Non authentifié");
      router.replace("/auth/login");
    } else if (isAuthenticated && inAuthGroup) {
      console.log("Redirection vers tabs - Authentifié");
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, router, isInitialized]);
}

export default function RootLayout() {
  const { isAuthenticated, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function initialize() {
      console.log("Initialisation de l'application...");
      const isAuth = await checkAuth();
      console.log("État d'authentification initial:", { isAuth });
      setIsChecking(false);
    }

    initialize();
  }, [checkAuth]);

  useProtectedRoute(isAuthenticated);

  if (isChecking) {
    return null; // Ou un composant de chargement
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
