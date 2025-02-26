import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../config/api";
import { authService } from "../services/api.service";

interface User {
  id: number;
  email: string;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
  login: async () => false,
  logout: async () => {},
  checkAuth: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthState = useCallback(
    async (token: string | null, userData: User | null) => {
      console.log("Mise à jour de l'état d'authentification:", {
        hasToken: !!token,
        hasUser: !!userData,
      });

      if (token) {
        await AsyncStorage.setItem("access_token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else {
        await AsyncStorage.removeItem("access_token");
        delete api.defaults.headers.common["Authorization"];
      }

      setUser(userData);
      setIsAuthenticated(!!userData);
    },
    []
  );

  const checkAuth = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      console.log("Vérification du token:", { hasToken: !!token });

      if (!token) {
        await new Promise<void>((resolve) => {
          setIsAuthenticated(false);
          setUser(null);
          setTimeout(resolve, 50);
        });
        return false;
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const userData = await authService.getProfile();

      if (userData) {
        await new Promise<void>((resolve) => {
          setUser(userData);
          setIsAuthenticated(true);
          setTimeout(resolve, 50);
        });
        console.log("Authentification vérifiée - Utilisateur connecté");
        return true;
      }

      throw new Error("Profil utilisateur invalide");
    } catch (error) {
      console.error("Erreur de vérification:", error);
      await new Promise<void>((resolve) => {
        setUser(null);
        setIsAuthenticated(false);
        setTimeout(resolve, 50);
      });
      delete api.defaults.headers.common["Authorization"];
      await AsyncStorage.removeItem("access_token");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Hook - Début de la tentative de connexion...");
      console.log("Hook - Envoi des identifiants:", {
        email,
        hasPassword: !!password,
      });

      if (!email || !password) {
        console.error("Hook - Email ou mot de passe manquant");
        throw new Error("Email et mot de passe requis");
      }

      console.log("Hook - Appel du service d'authentification...");
      const response = await authService
        .login({ email, password })
        .catch((error) => {
          console.error("Hook - Erreur du service d'authentification:", {
            name: error.name,
            message: error.message,
            isAxiosError: error.isAxiosError,
            response: error.response?.data,
            status: error.response?.status,
          });
          throw error;
        });

      console.log("Hook - Réponse du service:", {
        hasResponse: !!response,
        hasToken: !!response?.access_token,
        hasUser: !!response?.user,
      });

      if (!response || !response.access_token || !response.user) {
        console.error("Hook - Réponse invalide du service");
        throw new Error("Réponse invalide du serveur");
      }

      console.log("Hook - Mise à jour du token et de l'état...");

      // Configuration du token d'abord
      api.defaults.headers.common["Authorization"] =
        `Bearer ${response.access_token}`;
      await AsyncStorage.setItem("access_token", response.access_token);

      // Mise à jour synchrone de l'état
      setUser(response.user);
      setIsAuthenticated(true);

      console.log("Hook - État mis à jour avec succès");
      return true;
    } catch (error: any) {
      console.error("Hook - Erreur complète:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        isAxiosError: error.isAxiosError,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Réinitialisation de l'état
      setUser(null);
      setIsAuthenticated(false);
      delete api.defaults.headers.common["Authorization"];
      await AsyncStorage.removeItem("access_token");

      console.log("Hook - État réinitialisé après erreur");
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      await updateAuthState(null, null);
    }
  };

  // Vérifier l'authentification au montage du provider
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return null; // Ou un composant de chargement
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
