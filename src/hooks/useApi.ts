import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "../api/client";

export function useApiQuery<T>(
  key: string[],
  url: string,
  options?: Omit<UseQueryOptions<T, AxiosError>, "queryKey" | "queryFn">
) {
  return useQuery<T, AxiosError>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await apiClient.get<T>(url);
      return data;
    },
    ...options,
  });
}

export function useApiMutation<T, V>(
  url: string,
  options?: Omit<UseMutationOptions<T, AxiosError, V>, "mutationFn">
) {
  return useMutation<T, AxiosError, V>({
    mutationFn: async (variables) => {
      const { data } = await apiClient.post<T>(url, variables);
      return data;
    },
    ...options,
  });
}
