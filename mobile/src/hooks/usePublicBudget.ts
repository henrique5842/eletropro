import { useState, useCallback } from "react";
import { budgetContext, BudgetStatus } from "../context/BudgetContext";

export interface PublicBudgetStatus {
  budgetId: string;
  status: BudgetStatus;
  name: string;
  totalValue: number;
  validUntil?: string;
  updatedAt?: string;
}

export const usePublicBudget = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBudgetStatus = useCallback(
    async (
      accessLink: string,
      budgetId: string
    ): Promise<PublicBudgetStatus | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const status = await budgetContext.getBudgetStatusByPublicLink(
          accessLink,
          budgetId
        );
        return status;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateBudgetStatus = useCallback(
    async (
      accessLink: string,
      budgetId: string,
      status: "APPROVED" | "REJECTED",
      clientNotes?: string
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await budgetContext.updateBudgetStatusByPublicLink(
          accessLink,
          budgetId,
          status,
          clientNotes
        );
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    getBudgetStatus,
    updateBudgetStatus,
    clearError: () => setError(null),
  };
};
