import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import api from "../config/api";

// Interfaces
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  username: string;
  password_confirmation: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  imageUrl: string; // Pour la compatibilité avec l'interface existante
  isFavorite: boolean;
  category: Category;
  user: any;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    username: string;
  };
  message?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
}

export const authService = {
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    try {
      console.log("Service - Début de la connexion");

      // 1. Obtenir le cookie CSRF
      try {
        console.log("Tentative de récupération du cookie CSRF");
        const csrfResponse = await api.get("/sanctum/csrf-cookie");
        console.log("Réponse CSRF:", csrfResponse.status);
      } catch (csrfError) {
        console.error(
          "Erreur lors de la récupération du cookie CSRF:",
          csrfError
        );
      }

      // 2. Obtenir le nom de l'appareil
      let deviceName = "Appareil Mobile";
      try {
        deviceName = (await Device.modelName) || "Appareil Mobile";
        console.log("Nom de l'appareil récupéré:", deviceName);
      } catch (deviceError) {
        console.error(
          "Erreur lors de la récupération du nom de l'appareil:",
          deviceError
        );
      }

      // 3. Tentative de connexion
      console.log("Envoi de la requête de connexion avec:", {
        ...credentials,
        device_name: deviceName,
      });

      const response = await api.post<LoginResponse>("/login", {
        ...credentials,
        device_name: deviceName,
      });

      console.log("Réponse de connexion reçue:", {
        status: response.status,
        hasToken: !!response.data?.access_token,
        hasUser: !!response.data?.user,
      });

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

      // Sauvegarde du token
      await AsyncStorage.setItem("access_token", response.data.access_token);
      console.log("Token stocké avec succès");

      return response.data;
    } catch (error: any) {
      console.error("Service - Erreur complète de connexion:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  async register(data: RegisterData): Promise<ApiResponse<{ user: any }>> {
    try {
      const registerData = {
        ...data,
        password_confirmation: data.password,
      };
      const response = await api.post("/auth/register", registerData);
      console.log("Register response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
    await AsyncStorage.removeItem("access_token");
    delete api.defaults.headers.common["Authorization"];
  },

  async getProfile(): Promise<User> {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};

export const productService = {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    categoryId?: number;
    query?: string;
  }): Promise<PaginatedResponse<Product>> {
    try {
      const response = await api.get("/products", { params });
      console.log("Products API Response:", response.data);

      const productsData = response.data.items || response.data.data || [];
      const meta = {
        current_page: response.data.page || 1,
        last_page: response.data.totalPages || 1,
        per_page: response.data.limit || 10,
        total: response.data.total || 0,
      };

      const products = productsData.map((product: any) => ({
        id: product.id?.toString() || "",
        title: product.title || product.name || "",
        description: product.description || "",
        price: product.price || 0,
        images: product.images || [],
        imageUrl:
          product.images?.[0] ||
          product.image ||
          "https://via.placeholder.com/200",
        isFavorite: product.isFavorite || false,
        category: product.category || null,
        user: product.user || null,
        created_at: product.created_at || new Date().toISOString(),
      }));

      return {
        data: products,
        meta: meta,
      };
    } catch (error) {
      console.error("Erreur getProducts:", error);
      throw error;
    }
  },

  async getTrendingProducts(): Promise<PaginatedResponse<Product>> {
    const response = await api.get("/products/trending");
    return response.data;
  },

  async getProductDetails(id: number): Promise<ApiResponse<Product>> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: FormData): Promise<ApiResponse<Product>> {
    const response = await api.post("/products", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export const categoryService = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const response = await api.get("/categories");
      console.log("Categories API Response:", response.data); // Log pour déboguer

      // Gérer le cas où response.data est directement le tableau
      const categoriesData = Array.isArray(response.data)
        ? response.data
        : response.data.data;

      if (!categoriesData) {
        console.error("Données de catégories invalides:", response.data);
        return { data: [] };
      }

      const categories = categoriesData.map((category: any) => ({
        id: category.id?.toString() || "",
        name: category.name || "",
        description: category.description,
      }));

      return { data: categories };
    } catch (error) {
      console.error("Erreur getCategories:", error);
      throw error;
    }
  },
};

export const favoriteService = {
  async toggleFavorite(productId: number): Promise<ApiResponse<any>> {
    const response = await api.post(`/favorites/${productId}`);
    return response.data;
  },

  async getFavorites(): Promise<PaginatedResponse<Product>> {
    const response = await api.get("/favorites");
    return response.data;
  },
};
