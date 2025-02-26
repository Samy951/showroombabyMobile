import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { InternalAxiosRequestConfig } from "axios";

// Utilisez l'IP de votre machine locale au lieu de localhost
const DEV_API_URL = "http://192.168.68.118:8000/api"; // Remplacez par votre IP locale
const PROD_API_URL = "https://votre-api-production.com/api";

const BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

console.log("API URL:", BASE_URL); // Pour déboguer

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  },
  timeout: 30000,
  validateStatus: function (status) {
    console.log("Status de la réponse:", status);
    return status >= 200 && status < 500; // Accepte les statuts 2xx, 3xx et 4xx
  },
});

// Intercepteur pour ajouter le token Sanctum
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      console.log("Préparation de la requête:", {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data,
      });

      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Token ajouté aux headers");
      } else {
        console.log("Pas de token trouvé");
      }

      return config;
    } catch (error) {
      console.error("Erreur dans l'intercepteur de requête:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("Erreur dans l'intercepteur de requête:", error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => {
    console.log("Réponse reçue:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.log("Erreur d'authentification 401 - Suppression du token");
      await AsyncStorage.removeItem("access_token");
    }

    console.error("Erreur API détaillée:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      },
    });

    return Promise.reject(error);
  }
);

export default api;
