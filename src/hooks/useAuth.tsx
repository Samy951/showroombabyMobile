import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../config/api";
import { User, authService } from "../services/auth.service";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    password_confirmation: string;
  }) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => false,
  logout: async () => {},
  register: async () => false,
  checkAuth: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthState = useCallback(
    async (token: string | null, userData: User | null) => {
      console.log("useAuth - Mise à jour de l'état d'authentification:", {
        hasToken: !!token,
        hasUser: !!userData,
      });

      try {
        if (token) {
          await AsyncStorage.setItem("access_token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          
          if (userData) {
            await AsyncStorage.setItem("user", JSON.stringify(userData));
          }
        } else {
          await AsyncStorage.multiRemove(["access_token", "user"]);
          delete api.defaults.headers.common["Authorization"];
        }

        setUser(userData);
        setIsAuthenticated(!!userData);

        console.log("useAuth - État d'authentification mis à jour:", {
          isAuthenticated: !!userData,
          hasUser: !!userData,
        });
      } catch (error) {
        console.error("useAuth - Erreur lors de la mise à jour de l'état:", error);
        throw error;
      }
    },
    []
  );

  const checkAuth = useCallback(async () => {
    try {
      console.log("useAuth - Vérification de l'authentification...");
      
      // Toujours indiquer le chargement au début
      setIsLoading(true);
      
      // On commence par lire les données locales
      const [tokenResult, userResult] = await AsyncStorage.multiGet([
        "access_token", 
        "user"
      ]);
      
      const token = tokenResult[1];
      const userStr = userResult[1];
      
      console.log("useAuth - Données locales:", { 
        hasToken: !!token, 
        hasUserData: !!userStr,
        // Vérifier si c'est le token de développement
        isDevToken: token === "fake_dev_token"
      });

      // Cas où nous n'avons pas de token - pas authentifié
      if (!token) {
        console.log("useAuth - Pas de token trouvé, considéré comme non authentifié");
        await updateAuthState(null, null);
        setIsLoading(false);
        return false;
      }

      // Mode développement - Simuler une authentification réussie
      if (token === "fake_dev_token" && userStr) {
        try {
          const devUser = JSON.parse(userStr) as User;
          console.log("useAuth - Mode développement détecté");
          setUser(devUser);
          setIsAuthenticated(true);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          setIsLoading(false);
          return true;
        } catch (e) {
          console.error("useAuth - Erreur avec le mode développement:", e);
        }
      }

      // Définir le token dans les en-têtes pour les requêtes API
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      // Si on a des données utilisateur en cache, les utiliser temporairement
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr) as User;
          console.log("useAuth - Utilisation des données utilisateur en cache");
          setUser(cachedUser);
          setIsAuthenticated(true);
          
          // Essayer de rafraîchir les données en arrière-plan
          authService.getProfile()
            .then(freshUser => {
              console.log("useAuth - Données utilisateur rafraîchies");
              AsyncStorage.setItem("user", JSON.stringify(freshUser));
              setUser(freshUser);
            })
            .catch(e => {
              console.log("useAuth - Échec du rafraîchissement des données:", e);
              // On garde les données en cache pour l'instant
            })
            .finally(() => {
              setIsLoading(false);
            });
          
          return true;
        } catch (e) {
          console.error("useAuth - Erreur lors du parsing des données utilisateur:", e);
          // Continuer pour récupérer les données depuis l'API
        }
      }

      // Tenter de récupérer le profil utilisateur depuis le serveur
      try {
        console.log("useAuth - Récupération du profil depuis l'API...");
        const userData = await authService.getProfile();
        
        if (userData) {
          console.log("useAuth - Profil récupéré avec succès");
          await updateAuthState(token, userData);
          setIsLoading(false);
          return true;
        } else {
          console.log("useAuth - Profil récupéré mais invalide");
          await updateAuthState(null, null);
          setIsLoading(false);
          return false;
        }
      } catch (error) {
        console.error("useAuth - Erreur lors de la récupération du profil:", error);
        // Si le token est expiré ou invalide, on vide l'état d'authentification
        // Sauf en mode développement où on conserve l'état
        if (token !== "fake_dev_token") {
          await updateAuthState(null, null);
        }
        setIsLoading(false);
        return token === "fake_dev_token"; // Vrai si en mode dev
      }
    } catch (error) {
      console.error("useAuth - Erreur générale de vérification:", error);
      await updateAuthState(null, null);
      setIsLoading(false);
      return false;
    }
  }, [updateAuthState]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("useAuth - Début de la tentative de connexion...");

      if (!email || !password) {
        console.error("useAuth - Email ou mot de passe manquant");
        throw new Error("Email et mot de passe requis");
      }

      const response = await authService.login(email, password);
      console.log("useAuth - Réponse du service:", {
        hasToken: !!response?.access_token,
        hasUser: !!response?.user,
      });

      if (!response || !response.access_token || !response.user) {
        throw new Error("Réponse invalide du serveur");
      }

      // Important: mettre à jour l'état AVANT de retourner
      await updateAuthState(response.access_token, response.user);
      console.log("useAuth - Authentification réussie et état mis à jour");
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error("useAuth - Erreur de connexion:", error);
      await updateAuthState(null, null);
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    password_confirmation: string;
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("useAuth - Début de l'inscription...");
      await authService.register(data);
      
      // Après inscription réussie, connecter l'utilisateur
      return await login(data.email, data.password);
    } catch (error) {
      console.error("useAuth - Erreur d'inscription:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log("useAuth - Début de la déconnexion...");
      
      const token = await AsyncStorage.getItem("access_token");
      // Ne pas essayer d'appeler l'API en mode dev
      if (token !== "fake_dev_token") {
        await authService.logout();
      }
    } catch (error) {
      console.error("useAuth - Erreur lors de la déconnexion:", error);
    } finally {
      await updateAuthState(null, null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("useAuth - Premier rendu, vérification initiale de l'authentification");
    checkAuth().catch(error => {
      console.error("useAuth - Erreur initiale de vérification:", error);
      setIsLoading(false);
    });
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        register,
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