import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface VIPProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useVIPProducts() {
  const [error, setError] = useState<string | null>(null);

  // Obtener todos los productos VIP
  const { data: rawProducts = [], isLoading, refetch } = trpc.vipProducts.list.useQuery();

  const products: VIPProduct[] = rawProducts.map((product: any) => ({
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: Number(product.price),
    category: product.category ?? "General",
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }));

  // Crear producto VIP
  const createMutation = trpc.vipProducts.create.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Actualizar producto VIP
  const updateMutation = trpc.vipProducts.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Eliminar producto VIP
  const deleteMutation = trpc.vipProducts.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const createProduct = useCallback(
    async (name: string, description: string, price: number, category: string) => {
      setError(null);
      try {
        await createMutation.mutateAsync({
          name,
          description,
          price: parseFloat(price.toString()),
          category,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear producto";
        setError(message);
        throw err;
      }
    },
    [createMutation]
  );

  const updateProduct = useCallback(
    async (
      productId: number,
      updates: Partial<Omit<VIPProduct, "id" | "createdAt" | "updatedAt">>
    ) => {
      setError(null);
      try {
        await updateMutation.mutateAsync({
          id: productId,
          ...updates,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al actualizar producto";
        setError(message);
        throw err;
      }
    },
    [updateMutation]
  );

  const deleteProduct = useCallback(
    async (productId: number) => {
      setError(null);
      try {
        await deleteMutation.mutateAsync({ id: productId });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al eliminar producto";
        setError(message);
        throw err;
      }
    },
    [deleteMutation]
  );

  return {
    products,
    loading: isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error,
    fetchProducts: refetch,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
