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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.username.trim()) {
      errors.username = "Le nom d'utilisateur est requis";
    }

    if (!form.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Format d'email invalide";
    }

    if (!form.password) {
      errors.password = "Le mot de passe est requis";
    } else if (form.password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (form.password !== form.password_confirmation) {
      errors.password_confirmation = "Les mots de passe ne correspondent pas";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur pour ce champ quand l'utilisateur commence à taper
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRegister = async () => {
    try {
      // Valider le formulaire
      if (!validateForm()) {
        console.log("RegisterScreen - Erreurs de validation:", formErrors);
        return;
      }

      setLoading(true);
      console.log("RegisterScreen - Début de l'inscription...");
      console.log("RegisterScreen - Données:", {
        ...form,
        password: "[MASQUÉ]",
        password_confirmation: "[MASQUÉ]",
      });

      // Fermer le clavier pendant le chargement
      Keyboard.dismiss();

      // En mode développement, on peut ajouter un délai artificiel
      if (__DEV__) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const success = await register(form);
      console.log("RegisterScreen - Inscription réussie:", success);

      if (success) {
        // La redirection se fera automatiquement via useProtectedRoute
        Alert.alert(
          "Inscription réussie",
          "Votre compte a été créé avec succès. Vous allez être redirigé vers l'application."
        );
      } else {
        Alert.alert(
          "Échec de l'inscription",
          "L'inscription a échoué. Veuillez réessayer."
        );
      }
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
        console.log(
          "RegisterScreen - Erreur de réponse complète:",
          error.response
        );
        switch (error.response.status) {
          case 422:
            const validationErrors = error.response.data?.errors || {};
            errorMessage = Object.values(validationErrors).flat().join("\n");
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
                  className={`p-4 bg-gray-100 rounded-xl ${
                    formErrors.username ? "border border-red-500" : ""
                  }`}
                  placeholder="Votre nom d'utilisateur"
                  value={form.username}
                  onChangeText={(value) => handleChange("username", value)}
                  autoCapitalize="none"
                  autoComplete="username"
                />
                {formErrors.username && (
                  <Text className="mt-1 text-red-500">
                    {formErrors.username}
                  </Text>
                )}
              </View>

              <View>
                <Text className="mb-2 text-gray-600">Email</Text>
                <TextInput
                  className={`p-4 bg-gray-100 rounded-xl ${
                    formErrors.email ? "border border-red-500" : ""
                  }`}
                  placeholder="Votre email"
                  value={form.email}
                  onChangeText={(value) => handleChange("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                {formErrors.email && (
                  <Text className="mt-1 text-red-500">{formErrors.email}</Text>
                )}
              </View>

              <View>
                <Text className="mb-2 text-gray-600">Mot de passe</Text>
                <TextInput
                  className={`p-4 bg-gray-100 rounded-xl ${
                    formErrors.password ? "border border-red-500" : ""
                  }`}
                  placeholder="Votre mot de passe"
                  value={form.password}
                  onChangeText={(value) => handleChange("password", value)}
                  secureTextEntry
                  autoComplete="new-password"
                />
                {formErrors.password && (
                  <Text className="mt-1 text-red-500">
                    {formErrors.password}
                  </Text>
                )}
              </View>

              <View>
                <Text className="mb-2 text-gray-600">
                  Confirmation du mot de passe
                </Text>
                <TextInput
                  className={`p-4 bg-gray-100 rounded-xl ${
                    formErrors.password_confirmation
                      ? "border border-red-500"
                      : ""
                  }`}
                  placeholder="Confirmez votre mot de passe"
                  value={form.password_confirmation}
                  onChangeText={(value) =>
                    handleChange("password_confirmation", value)
                  }
                  secureTextEntry
                  autoComplete="new-password"
                />
                {formErrors.password_confirmation && (
                  <Text className="mt-1 text-red-500">
                    {formErrors.password_confirmation}
                  </Text>
                )}
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

            {/* NOUVEAU: Bouton de développement en bas */}
            {__DEV__ && (
              <View className="mt-6 border-t border-gray-200 pt-6">
                <Text className="text-center text-gray-500 mb-4">
                  Mode développement
                </Text>
                <TouchableOpacity
                  className="py-3 bg-green-600 rounded-xl"
                  onPress={async () => {
                    try {
                      setLoading(true);
                      // Simuler un délai
                      await new Promise((resolve) => setTimeout(resolve, 500));

                      // Créer un utilisateur test aléatoire
                      const randomId = Math.floor(Math.random() * 10000);
                      const testUser = {
                        username: `testuser${randomId}`,
                        email: `test${randomId}@example.com`,
                        password: "password123",
                        password_confirmation: "password123",
                      };

                      console.log("Register - Inscription test avec:", {
                        username: testUser.username,
                        email: testUser.email,
                      });

                      const success = await register(testUser);

                      if (success) {
                        console.log(
                          "Register - Inscription en mode développement réussie"
                        );
                        Alert.alert(
                          "Succès",
                          "Inscription en mode développement réussie"
                        );
                      } else {
                        Alert.alert(
                          "Échec",
                          "L'inscription en mode développement a échoué"
                        );
                      }
                    } catch (error) {
                      console.error("Erreur mode dev:", error);
                      Alert.alert(
                        "Erreur",
                        "Une erreur est survenue en mode développement"
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Text className="text-center text-white font-semibold">
                    Inscription avec utilisateur test
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
