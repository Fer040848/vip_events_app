import { useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { TRPCClientErrorLike } from "@trpc/client";

export interface AccessCode {
  id: number;
  code: string;
  role: "admin" | "user";
  displayName: string;
  isActive: boolean;
  userId?: number | null;
  lastUsedAt?: Date | null;
  createdAt?: Date;
}

export function useAccessCodes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query to get all codes
  const { data: codes = [], refetch: refetchCodes, isLoading: isQueryLoading } = trpc.accessCodes.list.useQuery(undefined);

  // Mutation to create a new code
  const createCodeMutation = trpc.accessCodes.create.useMutation();

  // Fetch all codes
  const fetchAllCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refetchCodes();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al obtener códigos";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [refetchCodes]);

  // Create new code
  const createCode = useCallback(
    async (code: string, role: "admin" | "user", _adminId?: string) => {
      setError(null);
      try {
        await createCodeMutation.mutateAsync({
          code: code.toUpperCase().trim(),
          role,
          displayName: code,
        });
        // Refetch codes after creation
        await refetchCodes();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear código";
        setError(message);
        throw err;
      }
    },
    [createCodeMutation, refetchCodes]
  );

  // Deactivate code (stub for now)
  const deactivateCode = useCallback(async (_codeId: number) => {
    setError("Función no implementada");
  }, []);

  return {
    codes: codes as AccessCode[],
    loading: loading || isQueryLoading || createCodeMutation.isPending,
    error: error || createCodeMutation.error?.message,
    fetchAllCodes,
    createCode,
    deactivateCode,
  };
}
