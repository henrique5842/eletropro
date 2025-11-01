import type {
  PublicClient,
  ApprovalRequest,
  RejectionRequest,
  MaterialList,
  MaterialListPublicData,
} from "@/types/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ClientApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ClientApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ClientApiError(
        `API Error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ClientApiError) {
      throw error;
    }
    throw new ClientApiError("Erro de conexão com o servidor");
  }
}

export const clientApi = {
  async getPublicClient(accessLink: string): Promise<PublicClient> {
    return fetchApi<PublicClient>(`/public/${accessLink}`);
  },

  async approveBudget(
    accessLink: string,
    budgetId: string,
    data: ApprovalRequest
  ): Promise<void> {
    return fetchApi<void>(`/public/${accessLink}/budgets/${budgetId}/approve`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async rejectBudget(
    accessLink: string,
    budgetId: string,
    data: RejectionRequest
  ): Promise<void> {
    return fetchApi<void>(`/public/${accessLink}/budgets/${budgetId}/reject`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getMaterialLists(accessLink: string): Promise<{
    client: { id: string; fullName: string };
    materialLists: MaterialList[];
  }> {
    return fetchApi<{
      client: { id: string; fullName: string };
      materialLists: MaterialList[];
    }>(`/public/${accessLink}/material-lists`);
  },

  async getMaterialListDetails(
    accessLink: string,
    materialListId: string
  ): Promise<MaterialListPublicData> {
    return fetchApi<MaterialListPublicData>(
      `/public/${accessLink}/material-lists/${materialListId}`
    );
  },

  async approveMaterialList(
    accessLink: string,
    materialListId: string,
    data: ApprovalRequest
  ): Promise<void> {
    return fetchApi<void>(
      `/public/${accessLink}/material-lists/${materialListId}/approve`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  async rejectMaterialList(
    accessLink: string,
    materialListId: string,
    data: RejectionRequest
  ): Promise<void> {
    return fetchApi<void>(
      `/public/${accessLink}/material-lists/${materialListId}/reject`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
};
