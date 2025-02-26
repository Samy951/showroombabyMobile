import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    try {
      setLoading(true);
      console.log("LoginScreen - Début de la connexion avec:", {
        email,
        hasPassword: !!password,
      });

      const success = await login(email, password).catch((error) => {
        console.error("LoginScreen - Erreur lors de la connexion:", {
          name: error.name,
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        throw error;
      });

      console.log("LoginScreen - Résultat de la connexion:", { success });

      if (!success) {
        console.error("LoginScreen - La connexion a retourné false");
        throw new Error("La connexion a échoué");
      }

      console.log("LoginScreen - Connexion réussie, redirection...");
      router.replace("/");
    } catch (error: any) {
      console.error("LoginScreen - Erreur détaillée:", {
        name: error.name,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        isAxiosError: error.isAxiosError,
      });

      let errorMessage = "Une erreur est survenue lors de la connexion";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log("LoginScreen - Affichage de l'erreur:", errorMessage);
      Alert.alert("Erreur de connexion", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-10">
        <TouchableOpacity className="mb-6" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text className="mb-8 text-3xl font-bold">Connexion</Text>

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
      </View>
    </SafeAreaView>
  );
}
