import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

/**
 * Hook qui permet de charger des données depuis l'API uniquement
 * lorsque l'authentification est vérifiée et que l'API est prête
 */
export function useApiData<T>(
  fetchFunction: () => Promise<T>,
  defaultValue: T,
  dependencies: any[] = []
) {
  const { isApiReady, isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isApiReady) {
      console.log("useApiData - API pas encore prête, chargement reporté");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("useApiData - Chargement des données...");
      const result = await fetchFunction();
      setData(result);
      console.log("useApiData - Données chargées avec succès");
    } catch (err: any) {
      console.error("useApiData - Erreur de chargement:", err);
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, isApiReady, ...dependencies]);

  useEffect(() => {
    // Ne pas essayer de charger les données si l'API n'est pas prête
    // ou si l'authentification est en cours
    if (isApiReady && !isAuthLoading) {
      fetchData();
    }
  }, [fetchData, isApiReady, isAuthLoading]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
