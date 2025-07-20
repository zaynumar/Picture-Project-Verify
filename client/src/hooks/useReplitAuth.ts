
import { useQuery } from "@tanstack/react-query";

export function useReplitAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    isReplitAuth: true, // Flag to identify this as Replit auth
  };
}
