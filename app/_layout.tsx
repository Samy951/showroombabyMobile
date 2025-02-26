import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/hooks/useAuth";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Hook personnalisé pour protéger les routes
function useProtectedRoute(isAuthenticated: boolean, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const [navigationReady, setNavigationReady] = useState(false);

  // Marquer la navigation comme prête après le chargement initial
  useEffect(() => {
    if (!isLoading && !navigationReady) {
      setNavigationReady(true);
    }
  }, [isLoading, navigationReady]);

  useEffect(() => {
    // Ne pas rediriger si toujours en chargement ou si la navigation n'est pas prête
    if (isLoading || !navigationReady) {
      return;
    }

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";
    const currentPath = segments.join("/");

    console.log("Navigation - État de navigation:", {
      isAuthenticated,
      inAuthGroup,
      inTabsGroup,
      segments,
      currentPath,
      isReady: !isLoading && navigationReady,
    });

    if (!isAuthenticated && !inAuthGroup) {
      // Non authentifié et pas sur une page d'auth -> rediriger vers login
      console.log("Navigation - Redirection vers login (non authentifié)");
      router.replace("/auth/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Authentifié et sur une page d'auth -> rediriger vers l'app
      console.log("Navigation - Redirection vers tabs (authentifié)");
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, router, isLoading, navigationReady]);
}

// Écran de chargement
function LoadingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 20, fontSize: 16, color: '#333' }}>Chargement...</Text>
    </SafeAreaView>
  );
}

// Écran d'erreur affiché en cas de problème persistant
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
        Impossible de se connecter
      </Text>
      <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
        Un problème est survenu lors de la connexion au serveur. Veuillez vérifier votre connexion internet.
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}
        onPress={onRetry}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Réessayer</Text>
      </TouchableOpacity>
      
      {__DEV__ && (
        <TouchableOpacity
          style={{ marginTop: 20, backgroundColor: '#28a745', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}
          onPress={async () => {
            try {
              // Stocker un faux token et un faux utilisateur
              await AsyncStorage.setItem("access_token", "fake_dev_token");
              await AsyncStorage.setItem("user", JSON.stringify({
                id: 1,
                email: "dev@example.com",
                username: "DeveloperMode"
              }));
              
              // Forcer un rechargement
              onRetry();
            } catch (e) {
              console.error("Erreur de mode dev:", e);
              Alert.alert("Erreur", "Impossible d'activer le mode développement");
            }
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Mode Dev: Simuler Connexion</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const [initTimeout, setInitTimeout] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    console.log("RootLayout - Initialisation de l'application...");
    
    // Ajouter un timeout pour éviter un blocage indéfini
    const timeoutId = setTimeout(() => {
      console.log("RootLayout - Timeout d'initialisation déclenché");
      setInitTimeout(true);
    }, 5000); // 5 secondes de timeout
    
    // Vérifier l'état d'authentification
    checkAuth()
      .then(success => {
        console.log("RootLayout - Vérification d'auth terminée:", { success });
        clearTimeout(timeoutId); // Annuler le timeout si la vérification s'est terminée normalement
      })
      .catch(error => {
        console.error("RootLayout - Erreur lors de la vérification d'authentification:", error);
        setShowError(true);
      });
    
    return () => clearTimeout(timeoutId);
  }, [checkAuth]);

  // Fonction pour réessayer la connexion
  const handleRetry = () => {
    setShowError(false);
    setInitTimeout(false);
    checkAuth().catch(() => setShowError(true));
  };

  useProtectedRoute(isAuthenticated, isLoading && !initTimeout);

  // Afficher un écran d'erreur si un problème persiste après le timeout
  if ((initTimeout && isLoading) || showError) {
    return <ErrorScreen onRetry={handleRetry} />;
  }

  // Afficher un indicateur de chargement pendant l'initialisation
  if (isLoading && !initTimeout) {
    return <LoadingScreen />;
  }

  // Rendu normal de l'application
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