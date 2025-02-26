import { Ionicons } from "@expo/vector-icons";
import { AxiosError } from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/hooks/useAuth";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validation des champs
    if (!form.username || !form.email || !form.password || !form.password_confirmation) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (form.password !== form.password_confirmation) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    try {
      setLoading(true);
      console.log("RegisterScreen - Début de l'inscription...");

      // Fermer le clavier pendant le chargement
      Keyboard.dismiss();

      const success = await register(form);
      console.log("RegisterScreen - Inscription réussie:", success);
      
      // La redirection se fera automatiquement via useProtectedRoute
    } catch (err) {
      const error = err as Error | AxiosError;
      console.error("RegisterScreen - Erreur détaillée:", {
        name: error.name,
        message: error.message,
        isAxiosError: error instanceof AxiosError,
        response:
          error instanceof AxiosError ? error.response?.data : undefined,
        status:
          error instanceof AxiosError ? error.response?.status : undefined,
      });

      let errorMessage = "Une erreur est survenue lors de l'inscription";

      if (error instanceof AxiosError && error.response) {
        switch (error.response.status) {
          case 422:
            const validationErrors = error.response.data?.errors || {};
            errorMessage = Object.values(validationErrors)
              .flat()
              .join("\n");
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
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.log("RegisterScreen - Affichage de l'erreur:", errorMessage);
      Alert.alert("Erreur d'inscription", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-1 px-6 pt-10 pb-6">
            <TouchableOpacity className="mb-6" onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <Text className="mb-8 text-3xl font-bold">Inscription</Text>

            <View className="space-y-4">
              <View>
                <Text className="mb-2 text-gray-600">Nom d'utilisateur</Text>
                <TextInput
                  className="p-4 bg-gray-100 rounded-xl"
                  placeholder="Votre nom d'utilisateur"
                  value={form.username}
                  onChangeText={(value) => handleChange("username", value)}
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </View>

              <View>
                <Text className="mb-2 text-gray-600">Email</Text>
                <TextInput
                  className="p-4 bg-gray-100 rounded-xl"
                  placeholder="Votre email"
                  value={form.email}
                  onChangeText={(value) => handleChange("email", value)}
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
                  value={form.password}
                  onChangeText={(value) => handleChange("password", value)}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              <View>
                <Text className="mb-2 text-gray-600">
                  Confirmation du mot de passe
                </Text>
                <TextInput
                  className="p-4 bg-gray-100 rounded-xl"
                  placeholder="Confirmez votre mot de passe"
                  value={form.password_confirmation}
                  onChangeText={(value) =>
                    handleChange("password_confirmation", value)
                  }
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>
            </View>

            <TouchableOpacity
              className="py-4 mt-8 bg-primary rounded-xl"
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-lg font-semibold text-center text-white">
                  S'inscrire
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4"
              onPress={() => router.push("/auth/login")}
            >
              <Text className="text-center text-gray-600">
                Déjà un compte ?{" "}
                <Text className="font-semibold text-primary">Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}