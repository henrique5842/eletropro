import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export interface BudgetItem {
  id?: string;
  serviceId?: string;
  materialId?: string;
  name?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  unit?: string;
  service?: {
    id: string;
    name: string;
    description?: string;
    price: number | string;
    unit: string;
    category?: string;
    professionalId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  material?: {
    id: string;
    name: string;
    description?: string;
    price: number | string;
    unit: string;
    category?: string;
    professionalId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface Budget {
  id?: string;
  name: string;
  clientId: string;
  clientName?: string;
  status?: BudgetStatus;
  items?: BudgetItem[];
  totalValue?: number;
  subtotal?: number;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountReason?: string;
  createdAt?: string;
  updatedAt?: string;
  validUntil?: string;
  notes?: string;
  accessLink?: string;
  professionalId?: string;
  client?: {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
  };
  _count?: {
    items: number;
  };
}

interface BudgetFilters {
  clientId?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type BudgetStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export const budgetContext = {
  
  async createBudget(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'totalValue'>): Promise<Budget> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await api.post('/budgets/', budgetData);
      
      await this.invalidateCache();
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar orçamento: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async listBudgets(filters?: BudgetFilters): Promise<Budget[]> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const cacheKey = `budgets_${JSON.stringify(filters || {})}`;
      const cachedData = await this.getCachedData(cacheKey);
      
      if (cachedData && this.isCacheValid(cachedData.timestamp)) {
        return cachedData.data;
      }

      let url = '/budgets/';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.clientId) params.append('clientId', filters.clientId);
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await api.get(url);
      
      await this.setCachedData(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      const cacheKey = `budgets_${JSON.stringify(filters || {})}`;
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData.data;
      }
      
      throw new Error('Erro ao listar orçamentos: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getBudgetById(id: string): Promise<Budget> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const cacheKey = `budget_${id}`;
      const cachedData = await this.getCachedData(cacheKey);
      
      if (cachedData && this.isCacheValid(cachedData.timestamp)) {
        return cachedData.data;
      }

      const response = await api.get(`/budgets/${id}`);
      
      await this.setCachedData(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      const cacheKey = `budget_${id}`;
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData.data;
      }
      
      throw new Error('Erro ao buscar orçamento: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async updateBudget(id: string, budgetData: Partial<Budget>): Promise<Budget> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await api.put(`/budgets/${id}`, budgetData);
      
      await this.invalidateCache();
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao atualizar orçamento: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async updateBudgetStatus(budgetId: string, status: BudgetStatus): Promise<Budget> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await api.patch(`/budgets/${budgetId}/status`, { status });
      
      await this.invalidateCache();
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao atualizar status: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async applyDiscount(budgetId: string, discountData: {
    discount: number;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountReason?: string;
  }): Promise<Budget> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await api.patch(`/budgets/${budgetId}/discount`, discountData);
      
      await this.invalidateCache();
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao aplicar desconto: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async removeDiscount(budgetId: string): Promise<Budget> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await api.delete(`/budgets/${budgetId}/discount`);
      
      await this.invalidateCache();
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao remover desconto: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async deleteBudget(id: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      await api.delete(`/budgets/${id}`);
      
      await this.invalidateCache();
      
    } catch (error) {
      throw new Error('Erro ao deletar orçamento: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async addBudgetItem(budgetId: string, itemData: Omit<BudgetItem, 'id' | 'totalPrice'>): Promise<BudgetItem> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await api.post(`/budgets/${budgetId}/items`, itemData);
      
      await this.invalidateBudgetCache(budgetId);
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao adicionar item: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async updateBudgetItem(budgetId: string, itemId: string, itemData: Partial<BudgetItem>): Promise<BudgetItem> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await api.put(`/budgets/${budgetId}/items/${itemId}`, itemData);
      
      await this.invalidateBudgetCache(budgetId);
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao atualizar item: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async removeBudgetItem(budgetId: string, itemId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      await api.delete(`/budgets/${budgetId}/items/${itemId}`);
      
      await this.invalidateBudgetCache(budgetId);
      
    } catch (error) {
      throw new Error('Erro ao remover item: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getCachedData(key: string): Promise<{data: any, timestamp: number} | null> {
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
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
    }
  },

  isCacheValid(timestamp: number): boolean {
    const CACHE_DURATION = 3 * 60 * 1000;
    return Date.now() - timestamp < CACHE_DURATION;
  },

  async invalidateCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_budget'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
    }
  },

  async invalidateBudgetCache(budgetId: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('cache_budget') && 
        (key.includes(budgetId) || key === 'cache_budgets_{}')
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
    }
  },

  validateBudget(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'totalValue'>): {isValid: boolean, errors: string[]} {
    const errors: string[] = [];

    if (!budgetData.name || budgetData.name.trim() === '') {
      errors.push('Nome do orçamento é obrigatório');
    }

    if (!budgetData.clientId || budgetData.clientId.trim() === '') {
      errors.push('Cliente é obrigatório');
    }

    const validStatuses: BudgetStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'];
    if (budgetData.status && !validStatuses.includes(budgetData.status)) {
      errors.push('Status inválido. Use: PENDING, APPROVED, REJECTED ou EXPIRED');
    }

    if (budgetData.validUntil) {
      const validDate = new Date(budgetData.validUntil);
      if (isNaN(validDate.getTime())) {
        errors.push('Data de validade inválida');
      } else if (validDate < new Date()) {
        errors.push('Data de validade deve ser futura');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateBudgetItem(itemData: Omit<BudgetItem, 'id' | 'totalPrice'>): {isValid: boolean, errors: string[]} {
    const errors: string[] = [];

    if (!itemData.name || itemData.name.trim() === '') {
      errors.push('Nome do item é obrigatório');
    }

    if (!itemData.quantity || itemData.quantity <= 0) {
      errors.push('Quantidade deve ser maior que zero');
    }

    if (!itemData.unitPrice || itemData.unitPrice <= 0) {
      errors.push('Preço unitário deve ser maior que zero');
    }

    if (!itemData.serviceId && !itemData.materialId) {
      errors.push('Item deve estar vinculado a um serviço ou material');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  calculateBudgetTotal(items: BudgetItem[]): number {
    return items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return total + itemTotal;
    }, 0);
  },

  calculateBudgetTotalWithDiscount(
    items: BudgetItem[], 
    discount?: number, 
    discountType?: 'PERCENTAGE' | 'FIXED'
  ): { subtotal: number, discountValue: number, total: number } {
    const subtotal = this.calculateBudgetTotal(items);
    
    let discountValue = 0;
    if (discount && discountType) {
      if (discountType === 'PERCENTAGE') {
        discountValue = (subtotal * discount) / 100;
      } else {
        discountValue = discount;
      }
    }

    const total = Math.max(0, subtotal - discountValue);

    return {
      subtotal,
      discountValue,
      total
    };
  },

  calculateItemTotal(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
  },

  async getBudgetsByClient(clientId: string): Promise<Budget[]> {
    try {
      const budgets = await this.listBudgets({ clientId });
      
      const filteredBudgets = budgets.filter(budget => budget.clientId === clientId);
      
      return filteredBudgets;
    } catch (error) {
      try {
        const allBudgets = await this.listBudgets();
        const clientBudgets = allBudgets.filter(budget => budget.clientId === clientId);
        return clientBudgets;
      } catch (fallbackError) {
        return [];
      }
    }
  },

  async getBudgetsByStatus(status: string): Promise<Budget[]> {
    try {
      return await this.listBudgets({ status });
    } catch (error) {
      return [];
    }
  },

  async duplicateBudget(originalBudgetId: string, newName: string): Promise<Budget> {
    try {
      const originalBudget = await this.getBudgetById(originalBudgetId);
      
      const newBudgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'totalValue'> = {
        name: newName,
        clientId: originalBudget.clientId,
        status: 'PENDING',
        notes: originalBudget.notes || '',
        validUntil: originalBudget.validUntil,
        discount: originalBudget.discount,
        discountType: originalBudget.discountType,
        discountReason: originalBudget.discountReason
      };
      
      const newBudget = await this.createBudget(newBudgetData);
      
      if (originalBudget.items && originalBudget.items.length > 0) {
        for (const item of originalBudget.items) {
          const itemData: Omit<BudgetItem, 'id' | 'totalPrice'> = {
            serviceId: item.serviceId,
            materialId: item.materialId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit
          };
          
          await this.addBudgetItem(newBudget.id!, itemData);
        }
      }
      
      return await this.getBudgetById(newBudget.id!);
      
    } catch (error) {
      throw new Error('Erro ao duplicar orçamento: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getBudgetStatusByPublicLink(accessLink: string, budgetId: string): Promise<{
    budgetId: string;
    status: BudgetStatus;
    name: string;
    totalValue: number;
    validUntil?: string;
    updatedAt?: string;
  }> {
    try {
      const response = await api.get(`/clients/public/${accessLink}/budgets/${budgetId}/status`);
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar status do orçamento: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getBudgetByPublicLink(accessLink: string, budgetId: string): Promise<Budget> {
    try {
      const response = await api.get(`/clients/public/${accessLink}/budgets/${budgetId}`);
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar orçamento: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async updateBudgetStatusByPublicLink(
    accessLink: string, 
    budgetId: string, 
    status: 'APPROVED' | 'REJECTED',
    clientNotes?: string
  ): Promise<{
    budgetId: string;
    status: BudgetStatus;
    updatedAt: string;
  }> {
    try {
      const requestBody: any = { status };
      if (clientNotes) {
        requestBody.clientNotes = clientNotes;
      }
      
      const response = await api.patch(`/clients/public/${accessLink}/budgets/${budgetId}/status`, requestBody);
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao atualizar status: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  generateBudgetSummary(budget: Budget): {
    totalItems: number;
    totalValue: number;
    itemsByType: {services: number, materials: number};
    averageItemValue: number;
  } {
    const items = budget.items || [];
    const totalItems = items.length;
    const totalValue = this.calculateBudgetTotal(items);
    
    const itemsByType = items.reduce((acc, item) => {
      if (item.serviceId) acc.services++;
      if (item.materialId) acc.materials++;
      return acc;
    }, {services: 0, materials: 0});
    
    const averageItemValue = totalItems > 0 ? totalValue / totalItems : 0;
    
    return {
      totalItems,
      totalValue,
      itemsByType,
      averageItemValue
    };
  },

  formatStatus(status: BudgetStatus): { label: string, color: string } {
    const statusMap: Record<BudgetStatus, { label: string, color: string }> = {
      PENDING: { label: 'Pendente', color: '#F59E0B' },
      APPROVED: { label: 'Aprovado', color: '#10B981' },
      REJECTED: { label: 'Rejeitado', color: '#EF4444' },
      EXPIRED: { label: 'Expirado', color: '#6B7280' }
    };
    
    return statusMap[status] || { label: status, color: '#6B7280' };
  },

  canEditBudget(budget: Budget): boolean {
    return budget.status === 'PENDING' || !budget.status;
  },

  isBudgetApproved(budget: Budget): boolean {
    return budget.status === 'APPROVED';
  }
  
};