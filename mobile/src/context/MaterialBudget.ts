import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

export interface MaterialListItem {
  id?: string;
  materialId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  unit?: string;
  material?: {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
  };
}

export interface MaterialList {
  id?: string;
  name: string;
  clientId: string;
  clientName?: string;
  budgetId?: string;
  budgetName?: string;
  status?: MaterialListStatus;
  items?: MaterialListItem[];
  totalValue?: number;
  createdAt?: string;
  updatedAt?: string;
  accessLink?: string;
  notes?: string;
}

interface MaterialListFilters {
  clientId?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  budgetId?: string;
}

export type MaterialListStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export const materialListContext = {
  async createMaterialList(
    materialListData: Omit<
      MaterialList,
      "id" | "createdAt" | "updatedAt" | "totalValue" | "accessLink"
    >
  ): Promise<MaterialList> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await api.post("/materialBudget/", materialListData);

      await this.invalidateCache();

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao criar lista de materiais: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async listMaterialLists(
    filters?: MaterialListFilters
  ): Promise<MaterialList[]> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const cacheKey = `materialLists_${JSON.stringify(filters || {})}`;
      const cachedData = await this.getCachedData(cacheKey);

      if (cachedData && this.isCacheValid(cachedData.timestamp)) {
        return cachedData.data;
      }

      let url = "/materialBudget/";
      if (filters) {
        const params = new URLSearchParams();
        if (filters.clientId) params.append("clientId", filters.clientId);
        if (filters.status) params.append("status", filters.status);
        if (filters.search) params.append("search", filters.search);
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.append("dateTo", filters.dateTo);
        if (filters.budgetId) params.append("budgetId", filters.budgetId);

        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await api.get(url);

      await this.setCachedData(cacheKey, response.data);

      return response.data;
    } catch (error) {
      const cacheKey = `materialLists_${JSON.stringify(filters || {})}`;
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData.data;
      }

      throw new Error(
        "Erro ao listar listas de materiais: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async getMaterialListById(id: string): Promise<MaterialList> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const cacheKey = `materialList_${id}`;
      const cachedData = await this.getCachedData(cacheKey);

      if (cachedData && this.isCacheValid(cachedData.timestamp)) {
        return cachedData.data;
      }

      const response = await api.get(`/materialBudget/${id}`);

      await this.setCachedData(cacheKey, response.data);

      return response.data;
    } catch (error) {
      const cacheKey = `materialList_${id}`;
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData.data;
      }

      throw new Error(
        "Erro ao buscar lista de materiais: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async updateMaterialList(
    id: string,
    materialListData: Partial<MaterialList>
  ): Promise<MaterialList> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await api.put(`/materialBudget/${id}`, materialListData);

      await this.invalidateCache();

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao atualizar lista de materiais: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async updateMaterialListStatus(
    materialListId: string,
    status: MaterialListStatus
  ): Promise<MaterialList> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await api.patch(
        `/materialBudget/${materialListId}/status`,
        { status }
      );

      await this.invalidateCache();

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao atualizar status: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async deleteMaterialList(id: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      await api.delete(`/materialBudget/${id}`);

      await this.invalidateCache();
    } catch (error) {
      throw new Error(
        "Erro ao deletar lista de materiais: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async addMaterialListItem(
    materialListId: string,
    itemData: Omit<MaterialListItem, "id" | "totalPrice" | "material">
  ): Promise<MaterialListItem> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await api.post(
        `/materialBudget/${materialListId}/items`,
        itemData
      );

      await this.invalidateMaterialListCache(materialListId);

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao adicionar item: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async updateMaterialListItem(
    materialListId: string,
    itemId: string,
    itemData: Partial<MaterialListItem>
  ): Promise<MaterialListItem> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await api.put(
        `/materialBudget/${materialListId}/items/${itemId}`,
        itemData
      );

      await this.invalidateMaterialListCache(materialListId);

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao atualizar item: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async removeMaterialListItem(
    materialListId: string,
    itemId: string
  ): Promise<void> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      await api.delete(`/materialBudget/${materialListId}/items/${itemId}`);

      await this.invalidateMaterialListCache(materialListId);
    } catch (error) {
      throw new Error(
        "Erro ao remover item: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async getMaterialListsByClient(clientId: string): Promise<MaterialList[]> {
    try {
      const materialLists = await this.listMaterialLists({ clientId });

      const filteredMaterialLists = materialLists.filter(
        (ml) => ml.clientId === clientId
      );

      return filteredMaterialLists;
    } catch (error) {
      try {
        const allMaterialLists = await this.listMaterialLists();
        const clientMaterialLists = allMaterialLists.filter(
          (ml) => ml.clientId === clientId
        );
        return clientMaterialLists;
      } catch (fallbackError) {
        return [];
      }
    }
  },

  async getMaterialListsByBudget(budgetId: string): Promise<MaterialList[]> {
    try {
      return await this.listMaterialLists({ budgetId });
    } catch (error) {
      return [];
    }
  },

  async getMaterialListsByStatus(status: string): Promise<MaterialList[]> {
    try {
      return await this.listMaterialLists({ status });
    } catch (error) {
      return [];
    }
  },

  async duplicateMaterialList(
    originalMaterialListId: string,
    newName: string
  ): Promise<MaterialList> {
    try {
      const originalMaterialList = await this.getMaterialListById(
        originalMaterialListId
      );

      const newMaterialListData: Omit<
        MaterialList,
        "id" | "createdAt" | "updatedAt" | "totalValue" | "accessLink"
      > = {
        name: newName,
        clientId: originalMaterialList.clientId,
        budgetId: originalMaterialList.budgetId,
        status: "PENDING",
        notes: originalMaterialList.notes || "",
      };

      const newMaterialList =
        await this.createMaterialList(newMaterialListData);

      if (originalMaterialList.items && originalMaterialList.items.length > 0) {
        for (const item of originalMaterialList.items) {
          const itemData: Omit<
            MaterialListItem,
            "id" | "totalPrice" | "material"
          > = {
            materialId: item.materialId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit,
          };

          await this.addMaterialListItem(newMaterialList.id!, itemData);
        }
      }

      return await this.getMaterialListById(newMaterialList.id!);
    } catch (error) {
      throw new Error(
        "Erro ao duplicar lista de materiais: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async getMaterialListStatusByPublicLink(
    accessLink: string,
    materialListId: string
  ): Promise<{
    materialListId: string;
    status: MaterialListStatus;
    name: string;
    totalValue: number;
    updatedAt?: string;
  }> {
    try {
      const response = await api.get(
        `/clients/public/${accessLink}/materialBudget/${materialListId}/status`
      );

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao buscar status da lista de materiais: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async getMaterialListByPublicLink(
    accessLink: string,
    materialListId: string
  ): Promise<MaterialList> {
    try {
      const response = await api.get(
        `/clients/public/${accessLink}/material-lists/${materialListId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao buscar lista de materiais: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async updateMaterialListStatusByPublicLink(
    accessLink: string,
    materialListId: string,
    status: "APPROVED" | "REJECTED",
    clientNotes?: string
  ): Promise<{
    materialListId: string;
    status: MaterialListStatus;
    updatedAt: string;
  }> {
    try {
      const requestBody: any = { status };
      if (clientNotes) {
        requestBody.clientNotes = clientNotes;
      }

      const response = await api.patch(
        `/materialBudget/${materialListId}/status`,
        requestBody
      );

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao atualizar status: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async getCachedData(
    key: string
  ): Promise<{ data: any; timestamp: number } | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  },

  async setCachedData(key: string, data: any): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {}
  },

  isCacheValid(timestamp: number): boolean {
    const CACHE_DURATION = 3 * 60 * 1000;
    return Date.now() - timestamp < CACHE_DURATION;
  },

  async invalidateCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) =>
        key.startsWith("cache_materialList")
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {}
  },

  async invalidateMaterialListCache(materialListId: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        (key) =>
          key.startsWith("cache_materialList") &&
          (key.includes(materialListId) || key === "cache_materialLists_{}")
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {}
  },

  validateMaterialList(
    materialListData: Omit<
      MaterialList,
      "id" | "createdAt" | "updatedAt" | "totalValue" | "accessLink"
    >
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!materialListData.name || materialListData.name.trim() === "") {
      errors.push("Nome da lista de materiais é obrigatório");
    }

    if (!materialListData.clientId || materialListData.clientId.trim() === "") {
      errors.push("Cliente é obrigatório");
    }

    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"];
    if (
      materialListData.status &&
      !validStatuses.includes(materialListData.status)
    ) {
      errors.push("Status inválido");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateMaterialListItem(
    itemData: Omit<MaterialListItem, "id" | "totalPrice" | "material">
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!itemData.name || itemData.name.trim() === "") {
      errors.push("Nome do item é obrigatório");
    }

    if (!itemData.materialId || itemData.materialId.trim() === "") {
      errors.push("Material é obrigatório");
    }

    if (!itemData.quantity || itemData.quantity <= 0) {
      errors.push("Quantidade deve ser maior que zero");
    }

    if (!itemData.unitPrice || itemData.unitPrice <= 0) {
      errors.push("Preço unitário deve ser maior que zero");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  calculateMaterialListTotal(items: MaterialListItem[]): number {
    return items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return total + itemTotal;
    }, 0);
  },

  calculateItemTotal(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
  },

  generateMaterialListSummary(materialList: MaterialList): {
    totalItems: number;
    totalValue: number;
    totalQuantity: number;
    averageItemValue: number;
  } {
    const items = materialList.items || [];
    const totalItems = items.length;
    const totalValue = this.calculateMaterialListTotal(items);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const averageItemValue = totalItems > 0 ? totalValue / totalItems : 0;

    return {
      totalItems,
      totalValue,
      totalQuantity,
      averageItemValue,
    };
  },

  async createMaterialListFromBudget(
    budgetId: string,
    name: string
  ): Promise<MaterialList> {
    try {
      const budgetResponse = await api.get(`/budgets/${budgetId}`);
      const budget = budgetResponse.data;

      const materialListData = {
        name: name || `Lista de Materiais - ${budget.name}`,
        clientId: budget.clientId,
        budgetId: budget.id,
        notes: `Criada a partir do orçamento: ${budget.name}`,
      };

      const materialList = await this.createMaterialList(materialListData);

      if (budget.items && budget.items.length > 0) {
        const materialItems = budget.items.filter(
          (item: any) => item.materialId
        );

        for (const item of materialItems) {
          const itemData = {
            materialId: item.materialId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit,
          };

          await this.addMaterialListItem(materialList.id!, itemData);
        }
      }

      return await this.getMaterialListById(materialList.id!);
    } catch (error) {
      throw new Error(
        "Erro ao criar lista de materiais: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },
};
