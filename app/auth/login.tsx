import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { AxiosError } from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/hooks/useAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    // Réinitialiser le message d'erreur
    setError(null);
    
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      setLoading(true);
      console.log("LoginScreen - Début de la connexion avec:", {
        email,
        hasPassword: !!password,
      });

      // Fermer le clavier pendant le chargement
      Keyboard.dismiss();

      const success = await login(email, password);
      console.log("LoginScreen - Connexion réussie:", success);
      
      // La redirection se fera automatiquement via useProtectedRoute
    } catch (err) {
      const error = err as Error | AxiosError;
      console.error("LoginScreen - Erreur détaillée:", {
        name: error.name,
        message: error.message,
        isAxiosError: error instanceof AxiosError,
        response:
          error instanceof AxiosError ? error.response?.data : undefined,
        status:
          error instanceof AxiosError ? error.response?.status : undefined,
      });

      let errorMessage = "Une erreur est survenue lors de la connexion";

      if (error instanceof AxiosError) {
        if (!error.response) {
          // Erreur réseau (pas de connexion au serveur)
          errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
        } else {
          switch (error.response.status) {
            case 422:
              const validationErrors = error.response.data?.errors || {};
              errorMessage = Object.values(validationErrors).flat().join("\n");
              break;
            case 401:
              errorMessage = "Email ou mot de passe incorrect";
              break;
            case 429:
              errorMessage =
                "Trop de tentatives. Veuillez patienter quelques minutes.";
              break;
            default:
              errorMessage =
                error.response.data?.message ||
                error.response.data?.error ||
                "Erreur de connexion au serveur";
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.log("LoginScreen - Affichage de l'erreur:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      setLoading(true);
      console.log("LoginScreen - Mode dev: simulation de connexion");

      // Stocker un faux token et un faux utilisateur
      await AsyncStorage.setItem("access_token", "fake_dev_token");
      await AsyncStorage.setItem("user", JSON.stringify({
        id: 1,
        email: "dev@example.com",
        username: "DeveloperMode"
      }));
      
      // Forcer un rechargement de l'app
      router.replace("/");
    } catch (e) {
      console.error("Erreur lors de la connexion de dev:", e);
      setError("Erreur lors de la simulation de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 pt-10">
          <TouchableOpacity className="mb-6" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="mb-8 text-3xl font-bold">Connexion</Text>

          {error && (
            <View className="mb-4 p-3 bg-red-100 rounded-lg">
              <Text className="text-red-700">{error}</Text>
            </View>
          )}

          <View className="space-y-4">
            <View>
              <Text className="mb-2 text-gray-600">Email</Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-xl"
                placeholder="Votre email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View>
              <Text className="mb-2 text-gray-600">Mot de passe</Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-xl"
                placeholder="Votre mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>
          </View>

          <TouchableOpacity
            className="py-4 mt-8 bg-primary rounded-xl"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-semibold text-center text-white">
                Se connecter
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4"
            onPress={() => router.push("/auth/register")}
          >
            <Text className="text-center text-gray-600">
              Pas encore de compte ?{" "}
              <Text className="font-semibold text-primary">S'inscrire</Text>
            </Text>
          </TouchableOpacity>
          
          {/* Bouton pour simuler une connexion réussie (pour le développement) */}
          {__DEV__ && (
            <TouchableOpacity
              className="py-4 mt-8 bg-green-600 rounded-xl"
              onPress={handleDevLogin}
            >
              <Text className="text-lg font-semibold text-center text-white">
                Mode Dev: Simuler Connexion
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}