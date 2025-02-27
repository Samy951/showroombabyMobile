import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { getDeviceName } from "../config/api";

export interface User {
  id: number;
  email: string;
  username: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: {
    email: string;
    username: string;
    password: string;
    password_confirmation: string;
  }): Promise<AuthResponse> {
    try {
      console.log("AuthService - Début de l'inscription");

      // Détection du mode développement
      if (__DEV__ && process.env.EXPO_PUBLIC_SKIP_AUTH === "true") {
        console.log(
          "AuthService - Mode développement avec authentification ignorée"
        );
        return this.createFakeAuthResponse(data.email, data.username);
      }

      // Ajouter le nom du dispositif pour Sanctum
      const device_name = await getDeviceName();

      // Utiliser les endpoints API appropriés pour l'inscription
      // Essayer avec l'endpoint standard Laravel Sanctum
      let response;
      try {
        console.log("AuthService - Tentative avec /auth/register");
        response = await api.post<AuthResponse>("/auth/register", {
          ...data,
          device_name,
        });
      } catch (err: any) {
        console.log(
          "AuthService - /auth/register a échoué, tentative avec /register"
        );
        // Si cela échoue, essayer avec l'endpoint de base
        response = await api.post<AuthResponse>("/register", {
          ...data,
          device_name,
        });
      }

      console.log("AuthService - Réponse d'inscription:", response.status);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      throw error;
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log("AuthService - Début de la connexion");

      // Détection du mode développement
      if (__DEV__ && process.env.EXPO_PUBLIC_SKIP_AUTH === "true") {
        console.log(
          "AuthService - Mode développement avec authentification ignorée"
        );
        return this.createFakeAuthResponse(email);
      }

      // Ajouter le nom du dispositif pour Sanctum
      const device_name = await getDeviceName();

      // Tenter la connexion avec l'endpoint standard Laravel Sanctum
      let response;
      try {
        console.log("AuthService - Tentative avec /sanctum/token");
        response = await api.post<AuthResponse>("/sanctum/token", {
          email,
          password,
          device_name,
        });
      } catch (err: any) {
        console.log(
          "AuthService - /sanctum/token a échoué, tentative avec /auth/login"
        );
        // Si cela échoue, essayer l'endpoint d'authentification standard
        response = await api.post<AuthResponse>("/auth/login", {
          email,
          password,
          device_name,
        });
      }

      console.log("AuthService - Réponse de connexion:", response.status);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      throw error;
    }
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout(): Promise<void> {
    try {
      console.log("AuthService - Début de la déconnexion");

      // Essayer les deux endpoints possibles pour la déconnexion
      try {
        console.log("AuthService - Tentative avec /auth/logout");
        await api.post("/auth/logout");
      } catch (err) {
        console.log(
          "AuthService - /auth/logout a échoué, tentative avec /logout"
        );
        await api.post("/logout");
      }

      // Supprimer les données locales
      await AsyncStorage.multiRemove(["access_token", "user"]);
      console.log("AuthService - Déconnexion réussie");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Quoi qu'il arrive, on supprime les données locales
      await AsyncStorage.multiRemove(["access_token", "user"]);
      throw error;
    }
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile(): Promise<User> {
    try {
      console.log("AuthService - Récupération du profil");

      // Détection du mode développement
      if (__DEV__ && process.env.EXPO_PUBLIC_SKIP_AUTH === "true") {
        console.log("AuthService - Mode développement avec profil fictif");
        return {
          id: 1,
          email: "dev@example.com",
          username: "DeveloperMode",
        };
      }

      // Essayer d'abord l'endpoint Laravel standard
      let response;
      try {
        console.log("AuthService - Tentative avec /api/user");
        response = await api.get<User>("/api/user");
      } catch (err) {
        console.log("AuthService - /api/user a échoué, tentative avec /user");
        response = await api.get<User>("/user");
      }

      console.log("AuthService - Profil récupéré avec succès");
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      throw error;
    }
  }

  /**
   * Vérifier si un token est valide
   */
  async checkToken(token: string): Promise<boolean> {
    try {
      console.log("AuthService - Vérification du token");

      // Mode développement
      if (token === "fake_dev_token") {
        console.log(
          "AuthService - Token de dev détecté, validation automatique"
        );
        return true;
      }

      // Faire une requête à l'API protégée pour vérifier si le token est valide
      try {
        await api.get("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("AuthService - Token valide");
        return true;
      } catch (err) {
        await api.get("/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("AuthService - Token valide (endpoint alternatif)");
        return true;
      }
    } catch (error) {
      console.log("AuthService - Token invalide");
      return false;
    }
  }

  /**
   * Créer une fausse réponse d'authentification pour le mode développement
   */
  private createFakeAuthResponse(
    email: string,
    username?: string
  ): AuthResponse {
    console.log(
      "AuthService - Création d'une fausse réponse d'authentification"
    );
    return {
      user: {
        id: 1,
        email: email,
        username: username || email.split("@")[0],
      },
      access_token: "fake_dev_token",
    };
  }
}

export const authService = new AuthService();
