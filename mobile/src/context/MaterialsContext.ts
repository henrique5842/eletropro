// services/materialService.ts
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Material {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: 'UNIT' | 'METER';
  professionalId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    budgetItems: number;
    materialListItems: number;
  };
}

export interface CreateMaterialData {
  name: string;
  category: string;
  price: number;
  unit: 'UNIT' | 'METER';
}

export interface UpdateMaterialData {
  name?: string;
  category?: string;
  price?: number;
  unit?: 'UNIT' | 'METER';
}

export interface MaterialsStats {
  totalMaterials: number;
  materialsWithUsage: number;
  totalUsageInBudgets: number;
  totalUsageInMaterialLists: number;
  materials: Material[];
}

export const materialService = {
  CACHE_KEYS: {
    MATERIALS_LIST: 'materials_list',
    MATERIALS_STATS: 'materials_stats',
    MATERIAL_CATEGORIES: 'material_categories'
  },

  validateMaterial(data: CreateMaterialData): { isValid: boolean; error?: string } {
    if (!data.name || !data.category || !data.price) {
      return { isValid: false, error: 'Nome, categoria e preço são obrigatórios' };
    }
    if (data.price <= 0) {
      return { isValid: false, error: 'Preço deve ser maior que zero' };
    }
    return { isValid: true };
  },

  async create(data: CreateMaterialData): Promise<Material> {
    try {
      const validation = this.validateMaterial(data);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const response = await api.post('/materials', data);
      
      await this.invalidateCache();
      
      return response.data;
    } catch (error: unknown) {
      throw new Error('Falha ao criar material: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async list(forceRefresh = false): Promise<Material[]> {
    try {
      console.log('🔄 MaterialService: Iniciando listagem de materiais...');
      
      if (!forceRefresh) {
        const cachedMaterials = await this.getCachedMaterials();
        // CORREÇÃO: Verificar se o cache é um array válido
        if (cachedMaterials && Array.isArray(cachedMaterials) && cachedMaterials.length >= 0) {
          console.log('📦 MaterialService: Usando cache válido');
          return cachedMaterials;
        } else {
          console.log('🔄 MaterialService: Cache inválido, buscando da API');
        }
      }

      const response = await api.get('/materials');
      console.log('📡 MaterialService: Resposta da API:', response.data);

      let materials: Material[] = [];
      
      if (response.data && response.data.materials && Array.isArray(response.data.materials)) {
        materials = response.data.materials;
        console.log('📊 MaterialService: Materiais extraídos da propriedade "materials"');
      } else if (Array.isArray(response.data)) {
        materials = response.data;
        console.log('📊 MaterialService: Resposta é array direto');
      } else {
        console.warn('⚠️ MaterialService: Estrutura de resposta não reconhecida');
        materials = [];
      }

      console.log('✅ MaterialService: Total de materiais encontrados:', materials.length);
      
      // CORREÇÃO: Só fazer cache se for um array válido
      if (Array.isArray(materials)) {
        await this.cacheMaterials(materials);
      }
      
      return materials;
    } catch (error: unknown) {
      console.error('❌ MaterialService: Erro ao listar materiais:', error);
      
      // CORREÇÃO: Verificar se o cache é válido antes de usar como fallback
      const cachedMaterials = await this.getCachedMaterials();
      if (cachedMaterials && Array.isArray(cachedMaterials)) {
        console.log('🔄 MaterialService: Usando cache válido como fallback');
        return cachedMaterials;
      }
      
      console.log('🔴 MaterialService: Nenhum cache válido disponível, retornando array vazio');
      return []; // SEMPRE retornar array, mesmo em caso de erro
    }
  },

  async getById(id: string): Promise<Material> {
    try {
      const response = await api.get(`/materials/${id}`);
      return response.data;
    } catch (error: unknown) {
      throw new Error('Material não encontrado: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async update(id: string, data: UpdateMaterialData): Promise<Material> {
    try {
      const response = await api.put(`/materials/${id}`, data);
      
      await this.invalidateCache();
      
      return response.data;
    } catch (error: unknown) {
      throw new Error('Falha ao atualizar material: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/materials/${id}`);
      
      await this.invalidateCache();
    } catch (error: unknown) {
      throw new Error('Falha ao deletar material: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getStats(forceRefresh = false): Promise<MaterialsStats> {
    try {
      if (!forceRefresh) {
        const cachedStats = await AsyncStorage.getItem(this.CACHE_KEYS.MATERIALS_STATS);
        if (cachedStats) {
          return JSON.parse(cachedStats);
        }
      }

      const response = await api.get('/materials/stats/usage');

      await AsyncStorage.setItem(this.CACHE_KEYS.MATERIALS_STATS, JSON.stringify(response.data));
      
      return response.data;
    } catch (error: unknown) {
      throw new Error('Falha ao carregar estatísticas: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getByCategory(category: string): Promise<Material[]> {
    try {
      const response = await api.get(`/materials/category/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error: unknown) {
      throw new Error('Falha ao buscar materiais por categoria: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async searchByName(searchTerm: string): Promise<Material[]> {
    try {
      const response = await api.get('/materials/search/all', {
        params: { q: searchTerm }
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error('Falha ao buscar materiais: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getCategories(): Promise<string[]> {
    try {
      const cachedCategories = await AsyncStorage.getItem(this.CACHE_KEYS.MATERIAL_CATEGORIES);
      if (cachedCategories) {
        return JSON.parse(cachedCategories);
      }

      const materials = await this.list();
      
      // CORREÇÃO: Garantir que materials seja sempre um array válido
      const materialsArray = Array.isArray(materials) ? materials : [];
      
      // Filtrar categorias válidas e remover duplicatas
      const categories = [...new Set(
        materialsArray
          .map(material => material?.category?.trim())
          .filter(category => category && category.length > 0)
      )].sort();
      
      await AsyncStorage.setItem(this.CACHE_KEYS.MATERIAL_CATEGORIES, JSON.stringify(categories));
      
      return categories;
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      // Retornar categorias padrão em caso de erro
      return [
        "Fios e Cabos",
        "Disjuntores", 
        "Tomadas e Interruptores",
        "Lâmpadas",
        "Condutos",
        "Quadros Elétricos",
        "Ferramentas",
        "Outros"
      ];
    }
  },

  async cacheMaterials(materials: Material[]): Promise<void> {
    try {
      // CORREÇÃO: Só fazer cache se for um array
      if (Array.isArray(materials)) {
        await AsyncStorage.setItem(this.CACHE_KEYS.MATERIALS_LIST, JSON.stringify(materials));
        console.log('💾 MaterialService: Cache salvo com sucesso');
      } else {
        console.warn('⚠️ Tentativa de cache com dados inválidos');
      }
    } catch (error) {
      console.error('❌ Erro ao fazer cache de materiais:', error);
    }
  },

  async getCachedMaterials(): Promise<Material[] | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.MATERIALS_LIST);
      if (cached) {
        const parsed = JSON.parse(cached);
        // CORREÇÃO: Verificar se o cache parseado é um array
        if (Array.isArray(parsed)) {
          return parsed;
        } else {
          console.warn('⚠️ Cache de materiais não é um array, limpando...');
          await AsyncStorage.removeItem(this.CACHE_KEYS.MATERIALS_LIST);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar cache de materiais:', error);
      // CORREÇÃO: Limpar cache corrompido
      await AsyncStorage.removeItem(this.CACHE_KEYS.MATERIALS_LIST);
      return null;
    }
  },

  async invalidateCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.CACHE_KEYS.MATERIALS_LIST,
        this.CACHE_KEYS.MATERIALS_STATS,
        this.CACHE_KEYS.MATERIAL_CATEGORIES
      ]);
      console.log('🗑️ MaterialService: Cache invalidado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao invalidar cache:', error);
    }
  },

  async refreshAllData(): Promise<{
    materials: Material[];
    stats: MaterialsStats;
    categories: string[];
  }> {
    try {
      const [materials, stats, categories] = await Promise.all([
        this.list(true),
        this.getStats(true),
        this.getCategories()
      ]);

      return { materials, stats, categories };
    } catch (error) {
      throw error;
    }
  }
};