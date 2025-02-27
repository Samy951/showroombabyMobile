import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/hooks/useAuth";

// Écran de chargement
function LoadingScreen() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 20, fontSize: 16, color: "#333" }}>
        Chargement...
      </Text>
    </SafeAreaView>
  );
}

// Écran d'erreur
function ErrorScreen({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 10,
          color: "#333",
        }}
      >
        Problème de connexion
      </Text>
      <Text style={{ textAlign: "center", marginBottom: 20, color: "#666" }}>
        {error ||
          "Un problème est survenu lors de la connexion au serveur. Veuillez vérifier votre connexion internet."}
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: "#007AFF",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
        }}
        onPress={onRetry}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Réessayer</Text>
      </TouchableOpacity>

      {__DEV__ && (
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: "#28a745",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={async () => {
            try {
              await AsyncStorage.setItem("access_token", "fake_dev_token");
              await AsyncStorage.setItem(
                "user",
                JSON.stringify({
                  id: 1,
                  email: "dev@example.com",
                  username: "DeveloperMode",
                })
              );
              onRetry();
            } catch (e) {
              console.error("Erreur de mode dev:", e);
            }
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            Mode Dev: Simuler Connexion
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const { isAuthenticated, isLoading, checkAuth, error, clearError } =
    useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // Vérification initiale d'authentification
  useEffect(() => {
    console.log("RootLayout - Vérification de l'authentification...");

    // Utiliser une référence pour savoir si le composant est monté
    let isMounted = true;

    // Mettre un court délai pour éviter les problèmes de timing
    setTimeout(async () => {
      try {
        await checkAuth();

        // Rediriger vers la page appropriée après la vérification
        if (isMounted) {
          if (isAuthenticated) {
            console.log(
              "RootLayout - Utilisateur authentifié, redirection vers l'app..."
            );
            router.replace("/(tabs)");
          } else {
            console.log(
              "RootLayout - Utilisateur non authentifié, redirection vers login..."
            );
            router.replace("/auth/login");
          }
        }
      } catch (err) {
        console.error("RootLayout - Erreur de vérification:", err);
      } finally {
        // Ne mettre à jour l'état que si le composant est toujours monté
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
    };
  }, [checkAuth, isAuthenticated, router]);

  // Navigation en fonction du statut d'authentification
  useEffect(() => {
    if (authChecked) {
      if (isAuthenticated) {
        console.log("RootLayout - Redirection vers l'application...");
        router.replace("/(tabs)");
      } else if (!isLoading && !error) {
        console.log("RootLayout - Redirection vers la page de connexion...");
        router.replace("/auth/login");
      }
    }
  }, [isAuthenticated, authChecked, isLoading, error, router]);

  // Afficher un écran de chargement pendant la vérification initiale
  if (isLoading && !authChecked) {
    return <LoadingScreen />;
  }

  // Afficher un écran d'erreur si nécessaire
  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => {
          clearError();
          setAuthChecked(false);
          checkAuth().finally(() => setAuthChecked(true));
        }}
      />
    );
  }

  // Utiliser Slot pour le rendu de base, sans initialRouteName
  return (
    <>
      <Slot />
      <StatusBar style="dark" />
    </>
  );
}
