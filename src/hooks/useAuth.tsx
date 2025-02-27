import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api, { initializeSanctum } from "../config/api";
import { User, authService } from "../services/auth.service";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isApiReady: boolean;
  user: User | null;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    password_confirmation: string;
  }) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  isApiReady: false,
  user: null,
  error: null,
  login: async () => false,
  logout: async () => {},
  register: async () => false,
  checkAuth: async () => false,
  clearError: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);

  // Met à jour l'état d'authentification dans le hook et le stockage
  const updateAuthState = useCallback(
    async (token: string | null, userData: User | null) => {
      try {
        console.log("useAuth - Mise à jour de l'état d'authentification", {
          hasToken: !!token,
          hasUser: !!userData,
        });

        if (token) {
          await AsyncStorage.setItem("access_token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          if (userData) {
            await AsyncStorage.setItem("user", JSON.stringify(userData));
          }
          setUser(userData);
          setIsAuthenticated(true);
          setIsApiReady(true);
        } else {
          await AsyncStorage.multiRemove(["access_token", "user"]);
          delete api.defaults.headers.common["Authorization"];
          setUser(null);
          setIsAuthenticated(false);
          setIsApiReady(false);
        }
      } catch (err) {
        console.error(
          "Erreur lors de la mise à jour de l'état d'authentification:",
          err
        );
        setError(
          "Erreur de stockage local. Veuillez redémarrer l'application."
        );
      }
    },
    []
  );

  // Efface les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Vérifie si l'utilisateur est authentifié au démarrage de l'app
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log("useAuth - Début de la vérification d'authentification");
      setIsLoading(true);
      setIsApiReady(false);
      clearError();

      // Récupérer le token depuis le stockage
      const token = await AsyncStorage.getItem("access_token");
      console.log("useAuth - Token trouvé:", token ? "Oui" : "Non");

      // Si pas de token, l'utilisateur n'est pas authentifié
      if (!token) {
        console.log("useAuth - Aucun token, utilisateur non authentifié");
        await updateAuthState(null, null);
        return false;
      }

      // Mode développement (faux token)
      if (token === "fake_dev_token") {
        try {
          console.log("useAuth - Mode développement détecté");
          const userStr = await AsyncStorage.getItem("user");
          if (userStr) {
            const userData = JSON.parse(userStr) as User;
            await updateAuthState(token, userData);
            console.log("useAuth - Authentification en mode dev réussie");
            return true;
          }
        } catch (err) {
          console.error("Erreur avec le mode développement:", err);
        }
      }

      // Si nous sommes en mode développement, nous pouvons sauter l'initialisation de Sanctum
      // pour permettre un développement plus rapide sans backend
      if (__DEV__ && process.env.EXPO_PUBLIC_SKIP_AUTH === "true") {
        console.log(
          "useAuth - Mode développement avec authentification ignorée"
        );
        setIsApiReady(true);
        return true;
      }

      // Initialiser Sanctum avant de vérifier le token
      console.log("useAuth - Initialisation de Sanctum...");
      const sanctumInitialized = await initializeSanctum();
      if (!sanctumInitialized) {
        console.error("useAuth - Échec d'initialisation de Sanctum");
        await updateAuthState(null, null);
        return false;
      }

      // Vérifier que le token est valide
      try {
        console.log("useAuth - Vérification du token avec l'API...");
        const userData = await authService.getProfile();
        console.log("useAuth - Token valide, utilisateur authentifié");
        await updateAuthState(token, userData);
        return true;
      } catch (err) {
        console.error("useAuth - Token invalide:", err);
        // Token invalide, supprimer les données d'auth
        await updateAuthState(null, null);
        return false;
      }
    } catch (err: any) {
      console.error("Erreur lors de la vérification d'authentification:", err);
      setError(err.message || "Erreur de connexion");
      await updateAuthState(null, null);
      return false;
    } finally {
      console.log("useAuth - Fin de la vérification d'authentification");
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [updateAuthState, clearError]);

  // Connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("useAuth - Tentative de connexion");
      setIsLoading(true);
      setIsApiReady(false);
      clearError();

      // Initialiser Sanctum avant la connexion
      const sanctumInitialized = await initializeSanctum();
      if (!sanctumInitialized) {
        throw new Error("Impossible de se connecter au serveur");
      }

      const response = await authService.login(email, password);

      if (!response.access_token || !response.user) {
        throw new Error("Réponse du serveur invalide");
      }

      console.log("useAuth - Connexion réussie");
      await updateAuthState(response.access_token, response.user);
      return true;
    } catch (err: any) {
      console.error("Erreur de connexion:", err);
      setError(err.message || "Échec de connexion");
      await updateAuthState(null, null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Inscription
  const register = async (data: {
    email: string;
    username: string;
    password: string;
    password_confirmation: string;
  }): Promise<boolean> => {
    try {
      console.log("useAuth - Tentative d'inscription");
      setIsLoading(true);
      setIsApiReady(false);
      clearError();

      // Initialiser Sanctum avant l'inscription
      const sanctumInitialized = await initializeSanctum();
      if (!sanctumInitialized) {
        throw new Error("Impossible de se connecter au serveur");
      }

      const response = await authService.register(data);

      if (!response.access_token || !response.user) {
        throw new Error("Réponse du serveur invalide");
      }

      console.log("useAuth - Inscription réussie");
      await updateAuthState(response.access_token, response.user);
      return true;
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      setError(err.message || "Échec d'inscription");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Déconnexion
  const logout = async (): Promise<void> => {
    try {
      console.log("useAuth - Tentative de déconnexion");
      setIsLoading(true);
      setIsApiReady(false);
      clearError();

      try {
        await authService.logout();
      } catch (err) {
        console.error("Erreur lors de la déconnexion:", err);
        // Continuer même en cas d'erreur pour s'assurer que l'utilisateur est déconnecté localement
      }

      // Toujours mettre à jour l'état local même si la requête API échoue
      console.log("useAuth - Déconnexion réussie");
      await updateAuthState(null, null);
    } finally {
      setIsLoading(false);
    }
  };

  // Effet initial pour charger l'état d'authentification au démarrage
  useEffect(() => {
    // Uniquement vérifier l'authentification au premier chargement
    if (!isInitialized) {
      console.log(
        "useAuth - Premier chargement, vérification d'authentification"
      );

      // Ajouter un timeout de sécurité pour éviter un blocage infini
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn(
            "Timeout de vérification d'authentification après 10 secondes"
          );
          setIsLoading(false);
          setIsAuthenticated(false);
          setError("Délai d'attente dépassé. Veuillez réessayer.");
        }
      }, 10000);

      checkAuth().catch((err) => {
        console.error(
          "useAuth - Erreur lors de la vérification initiale:",
          err
        );
        setIsLoading(false);
        setIsAuthenticated(false);
      });

      return () => clearTimeout(timeoutId);
    }
  }, [checkAuth, isInitialized, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isApiReady,
        user,
        error,
        login,
        logout,
        register,
        checkAuth,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
