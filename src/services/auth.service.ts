import AsyncStorage from "@react-native-async-storage/async-storage";
import { AxiosError } from "axios";
import * as Device from "expo-device";
import api from "../config/api";

export interface User {
  id: number;
  email: string;
  username: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  message?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const authService = {
  async testConnection(): Promise<boolean> {
    try {
      console.log("authService - Test de connexion au serveur...");
      const response = await api.get("/sanctum/csrf-cookie");
      console.log("authService - Serveur accessible:", {
        status: response.status,
      });
      return true;
    } catch (error) {
      console.error("authService - Serveur inaccessible:", error);
      return false;
    }
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log("authService - Début du processus de connexion...");

      // Récupération du nom de l'appareil
      let deviceName = "Appareil Mobile";
      try {
        deviceName = await Device.modelName || "Appareil Mobile";
        console.log("authService - Nom de l'appareil récupéré:", deviceName);
      } catch (err) {
        console.warn(
          "authService - Erreur lors de la récupération du nom de l'appareil:",
          err
        );
      }

      // Préparation des données de connexion
      const loginData = {
        email,
        password,
        device_name: deviceName,
      };

      console.log("authService - Envoi de la requête de connexion:", {
        email,
        device_name: deviceName,
        url: "/auth/login",
      });

      // Tentative de connexion avec timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      try {
        const response = await api.post<LoginResponse>("/auth/login", loginData, {
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        console.log("authService - Réponse de connexion reçue:", {
          status: response.status,
          hasToken: !!response.data?.access_token,
          hasUser: !!response.data?.user,
        });

        // Vérification de la réponse
        if (!response.data?.access_token) {
          throw new Error(
            "Authentification échouée : pas de token dans la réponse"
          );
        }

        if (!response.data?.user) {
          throw new Error(
            "Authentification échouée : pas d'utilisateur dans la réponse"
          );
        }

        return response.data;
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    } catch (err) {
      const error = err as Error | AxiosError;

      console.error("authService - Erreur d'authentification détaillée:", {
        name: error.name,
        message: error.message,
        isAxiosError: error instanceof AxiosError,
        status:
          error instanceof AxiosError ? error.response?.status : undefined,
      });

      if (error.name === 'AbortError') {
        throw new Error("La connexion a pris trop de temps. Veuillez réessayer.");
      }

      if (error instanceof AxiosError) {
        if (!error.response) {
          throw new Error(
            "Le serveur ne répond pas. Vérifiez votre connexion internet et réessayez."
          );
        }

        switch (error.response.status) {
          case 422:
            const validationErrors = error.response.data?.errors || {};
            const errorMessages = Object.values(validationErrors).flat();
            throw new Error(
              errorMessages.join("\n") || "Email ou mot de passe incorrect"
            );

          case 429:
            throw new Error(
              "Trop de tentatives de connexion. Veuillez patienter quelques minutes."
            );

          case 401:
            throw new Error("Email ou mot de passe incorrect");

          default:
            throw new Error(
              error.response.data?.message ||
                error.response.data?.error ||
                `Erreur serveur (${error.response.status}). Veuillez réessayer.`
            );
        }
      }

      // Si ce n'est pas une erreur Axios, on renvoie l'erreur originale
      throw error;
    }
  },

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      console.log("authService - Début du processus d'inscription...");

      // Ajouter un timeout pour éviter un blocage indéfini
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      try {
        const response = await api.post<ApiResponse<User>>("/auth/register", data, {
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        console.log("authService - Réponse d'inscription reçue:", {
          status: response.status,
          data: response.data,
        });

        return response.data;
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    } catch (error) {
      console.error("authService - Erreur d'inscription:", error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      console.log("authService - Tentative de déconnexion...");
      await api.post("/auth/logout");
      console.log("authService - Déconnexion réussie côté serveur");
    } catch (error) {
      console.error("authService - Erreur lors de la déconnexion côté serveur:", error);
    } finally {
      // On supprime toujours les tokens locaux
      await AsyncStorage.multiRemove(["access_token", "user"]);
      console.log("authService - Tokens locaux supprimés");
    }
  },

  async getProfile(): Promise<User> {
    try {
      console.log("authService - Récupération du profil utilisateur...");
      
      // Ajouter un timeout pour éviter un blocage indéfini
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const response = await api.get<ApiResponse<User>>("/users/profile", {
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        console.log("authService - Profil récupéré avec succès");
        return response.data.data;
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        throw new Error("La récupération du profil a pris trop de temps.");
      }
      console.error("authService - Erreur lors de la récupération du profil:", error);
      throw error;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("access_token");
      return !!token;
    } catch (error) {
      console.error(
        "authService - Erreur lors de la vérification de l'authentification:",
        error
      );
      return false;
    }
  },
};