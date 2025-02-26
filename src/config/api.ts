import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Utilisez l'IP de votre machine locale au lieu de localhost
const DEV_API_URL = "http://192.168.68.118:8000";
const PROD_API_URL = "https://votre-api-production.com";

const BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

console.log("Configuration API:", {
  baseURL: BASE_URL,
  environment: __DEV__ ? "development" : "production",
});

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true, // Important pour Sanctum
  timeout: 10000, // Timeout global de 10 secondes
});

// Intercepteur pour gérer les requêtes
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const originalUrl = config.url || "";
    
    // Ne pas modifier l'URL pour la requête CSRF
    if (!originalUrl.includes("sanctum/csrf-cookie")) {
      // Ajouter le préfixe /api si nécessaire
      config.url = originalUrl.startsWith("/api")
        ? originalUrl
        : `/api${originalUrl.startsWith("/") ? originalUrl : `/${originalUrl}`}`;
    }

    // Ajouter le token d'authentification si disponible
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Logging pour le débogage
    console.log("API - Requête:", {
      url: config.url,
      method: config.method,
      hasAuthHeader: !!token,
    });

    return config;
  } catch (error) {
    console.error("API - Erreur dans l'intercepteur de requête:", error);
    return Promise.reject(error);
  }
});

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  (response) => {
    // Logging des réponses réussies
    console.log("API - Réponse réussie:", {
      url: response.config.url,
      status: response.status,
      hasData: !!response.data,
    });
    return response;
  },
  async (error) => {
    // Si l'erreur est due à un timeout
    if (error.code === 'ECONNABORTED') {
      console.error("API - Timeout de la requête:", {
        url: error.config?.url,
        timeout: error.config?.timeout,
      });
      throw new Error("La requête a pris trop de temps. Veuillez réessayer.");
    }
    
    // Si c'est une erreur réseau (pas de réponse du serveur)
    if (!error.response) {
      console.error("API - Erreur réseau:", {
        message: error.message,
        code: error.code,
        url: error.config?.url,
      });
      throw new Error(
        "Erreur de connexion au serveur. Vérifiez votre connexion internet."
      );
    }

    console.error("API - Erreur de réponse:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Gérer les erreurs d'authentification
    switch (error.response.status) {
      case 401:
        // Token expiré ou non valide - déconnexion
        await AsyncStorage.multiRemove(["access_token", "user"]);
        throw new Error("Session expirée. Veuillez vous reconnecter.");

      case 419:
        // CSRF token expiré ou invalide
        console.log("API - Token CSRF expiré");
        throw new Error("Erreur de sécurité. Veuillez réessayer.");

      case 422:
        // Erreurs de validation
        const validationErrors = error.response.data?.errors || {};
        const errorMessages = Object.values(validationErrors).flat();
        throw new Error(errorMessages.join("\n") || "Données invalides");

      case 429:
        // Trop de requêtes
        throw new Error(
          "Trop de tentatives. Veuillez patienter quelques minutes."
        );

      default:
        // Autres erreurs
        throw new Error(
          error.response.data?.message ||
            error.response.data?.error ||
            `Erreur serveur (${error.response.status}). Veuillez réessayer.`
        );
    }
  }
);

export default api;