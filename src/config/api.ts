import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as Device from "expo-device";

// Configuration de l'API
const DEV_API_URL = "http://192.168.68.118:8000";
const PROD_API_URL = "https://votre-api-production.com";

const BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

console.log("Configuration API:", {
  baseURL: BASE_URL,
  environment: __DEV__ ? "development" : "production",
});

// Variable pour stocker l'état de Sanctum
let isSanctumInitialized = false;

// Variable pour contrôler les tentatives de reconnexion
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Obtenir le nom du dispositif pour Sanctum
export const getDeviceName = async (): Promise<string> => {
  try {
    const deviceName =
      Device.deviceName || Device.modelName || "Unknown Device";
    return deviceName;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du nom de l'appareil:",
      error
    );
    return "Application Mobile";
  }
};

// Fonction pour vérifier la connectivité réseau
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  } catch (error) {
    console.error("API - Erreur lors de la vérification du réseau:", error);
    return false;
  }
};

// Fonction pour vérifier si le serveur est accessible
export const checkServerAvailability = async (): Promise<boolean> => {
  try {
    console.log("API - Vérification de la disponibilité du serveur...");
    // Utiliser une requête simple pour vérifier si le serveur répond
    const response = await axios
      .get(`${BASE_URL}/api/health-check`, {
        timeout: 5000,
      })
      .catch(() => {
        // En cas d'échec sur /health-check, essayer une autre URL
        return axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
          timeout: 5000,
        });
      });

    // Réinitialiser les tentatives de reconnexion si le serveur est disponible
    reconnectAttempts = 0;
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error("API - Serveur inaccessible:", error);

    // Incrémenter les tentatives de reconnexion
    reconnectAttempts++;

    // Si nous sommes en développement, considérer que le serveur est disponible
    // après un certain nombre de tentatives
    if (__DEV__ && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(
        "API - Mode développement: Ignorer l'indisponibilité du serveur"
      );
      return true;
    }

    return false;
  }
};

// Fonction pour initialiser Sanctum
export const initializeSanctum = async (): Promise<boolean> => {
  // Si déjà initialisé, ne pas le refaire
  if (isSanctumInitialized) {
    console.log("API - Sanctum déjà initialisé");
    return true;
  }

  // Vérifier la connexion réseau d'abord
  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    console.error("API - Pas de connexion réseau");
    return false;
  }

  try {
    console.log("API - Initialisation de Sanctum...");
    // Récupérer le CSRF token
    const response = await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
      timeout: 5000,
    });
    console.log("API - Sanctum initialisé avec succès:", response.status);
    isSanctumInitialized = true;
    return true;
  } catch (error) {
    console.error("API - Erreur d'initialisation Sanctum:", error);
    // Considérer l'initialisation comme réussie en mode développement même en cas d'erreur
    // Cela permet de continuer à utiliser l'application sans Sanctum
    if (__DEV__) {
      console.warn("API - Mode développement: Sanctum ignoré");
      isSanctumInitialized = true;
      return true;
    }
    return false;
  }
};

// Fonction pour réinitialiser l'état de Sanctum
export const resetSanctum = () => {
  isSanctumInitialized = false;
  reconnectAttempts = 0;
};

// Créer l'instance axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  timeout: 15000,
});

// Intercepteur de requêtes
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    // Vérifier la connexion réseau
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error(
        "Pas de connexion internet. Veuillez vérifier votre réseau."
      );
    }

    // Préfixe pour les URL API
    if (
      config.url &&
      !config.url.includes("sanctum/csrf-cookie") &&
      !config.url.includes("sanctum/token")
    ) {
      config.url = config.url.startsWith("/api")
        ? config.url
        : `/api${config.url.startsWith("/") ? config.url : `/${config.url}`}`;
    }

    // Ajouter le token d'authentification pour les requêtes
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Déboguer les requêtes en mode développement
    if (__DEV__) {
      console.log(`API - Envoi d'une requête à ${config.url}`);
    }

    return config;
  } catch (error) {
    console.error("Erreur dans l'intercepteur de requête:", error);
    return Promise.reject(error);
  }
});

// Intercepteur de réponses
api.interceptors.response.use(
  (response) => {
    // Déboguer les réponses en mode développement
    if (__DEV__) {
      console.log(`API - Réponse de ${response.config.url}:`, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Si c'est une erreur de timeout
    if (error.code === "ECONNABORTED") {
      console.error("Timeout de la requête:", error.config?.url);
      throw new Error("La requête a pris trop de temps. Veuillez réessayer.");
    }

    // Si c'est une erreur réseau
    if (!error.response) {
      console.error("Erreur réseau:", error.message);
      throw new Error(
        "Erreur de connexion au serveur. Vérifiez votre connexion internet."
      );
    }

    // Déboguer les erreurs en mode développement
    if (__DEV__) {
      console.error(
        `API - Erreur ${error.response.status} pour ${error.config?.url}`
      );
    }

    // Gérer les erreurs d'authentification
    if (error.response.status === 401) {
      // Token expiré ou invalide
      await AsyncStorage.multiRemove(["access_token", "user"]);
      delete api.defaults.headers.common["Authorization"];
      console.log("API - Suppression du token suite à une erreur 401");
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    // Autres erreurs HTTP
    let errorMessage = `Erreur serveur (${error.response.status}). Veuillez réessayer.`;

    if (error.response.data && typeof error.response.data === "object") {
      const data = error.response.data as Record<string, any>;
      if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      }
    }

    throw new Error(errorMessage);
  }
);

export default api;
