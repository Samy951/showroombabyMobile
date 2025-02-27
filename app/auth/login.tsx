import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth";

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Effacer les erreurs lorsque les entrées changent
  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    if (error) clearError();
    setter(value);
  };

  // Gérer la connexion
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre email");
      return;
    }

    if (!password) {
      Alert.alert("Erreur", "Veuillez entrer votre mot de passe");
      return;
    }

    try {
      setLoading(true);
      const success = await login(email, password);
      if (success) {
        // Redirection vers l'accueil géré par le RootLayout
        console.log("Connexion réussie, redirection vers l'accueil...");
      }
    } catch (err: any) {
      console.error("Erreur de connexion:", err);
      Alert.alert(
        "Erreur de connexion",
        err.message || "Impossible de se connecter. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>
            Bienvenue ! Connectez-vous pour accéder à votre compte.
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(value) => handleInputChange(setEmail, value)}
              placeholder="Entrez votre email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(value) => handleInputChange(setPassword, value)}
                placeholder="Entrez votre mot de passe"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.visibilityBtn}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Text style={styles.visibilityText}>
                  {showPassword ? "Masquer" : "Afficher"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous n'avez pas de compte ?</Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.linkText}>Créer un compte</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

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

                  // Utiliser le mode développement
                  const success = await login("dev@example.com", "password");

                  if (success) {
                    console.log(
                      "Login - Connexion en mode développement réussie"
                    );
                  } else {
                    Alert.alert(
                      "Échec",
                      "La connexion en mode développement a échoué"
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
                Connexion en mode développement
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  passwordContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  visibilityBtn: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  visibilityText: {
    color: "#007AFF",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#80b6fb",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#666",
    marginRight: 5,
  },
  linkText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    padding: 15,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
  },
});
