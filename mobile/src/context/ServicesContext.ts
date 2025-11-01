import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export type ServiceUnit = 'UNIT' | 'METER';

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: ServiceUnit;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  price: number;
  unit: ServiceUnit;
  category?: string;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

export const servicesContext = {
  async createService(serviceData: CreateServiceData): Promise<Service> {
    try {
      const validation = this.validateService(serviceData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await api.post('/services', serviceData);
      
      let createdService = null;
      if (response.data && response.data.service) {
        createdService = response.data.service;
      } else if (response.data && response.data.id) {
        createdService = response.data;
      } else {
        createdService = response.data;
      }
      
      await this.updateLocalServicesCache(createdService, 'create');
      
      return createdService;
    } catch (error) {
      throw new Error('Erro ao criar serviço: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getServices(): Promise<Service[]> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const cachedServices = await AsyncStorage.getItem('cachedServices');
      
      try {
        const response = await api.get('/services');
        
        let services = [];
        if (response.data && Array.isArray(response.data)) {
          services = response.data;
        } else if (response.data && response.data.services && Array.isArray(response.data.services)) {
          services = response.data.services;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          services = response.data.data;
        }
        
        await AsyncStorage.setItem('cachedServices', JSON.stringify(services));
        
        return services;
      } catch (apiError) {
        if (cachedServices) {
          const services = JSON.parse(cachedServices);
          return services;
        }
        
        throw apiError;
      }
    } catch (error) {
      throw new Error('Erro ao buscar serviços: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getServiceById(id: string): Promise<Service | null> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await api.get(`/services/${id}`);
      
      let service = null;
      if (response.data && response.data.service) {
        service = response.data.service;
      } else if (response.data && response.data.id) {
        service = response.data;
      } else {
        service = response.data;
      }
      
      return service;
    } catch (error) {
      try {
        const cachedServices = await AsyncStorage.getItem('cachedServices');
        if (cachedServices) {
          const services = JSON.parse(cachedServices);
          const service = services.find((s: Service) => s.id === id);
          if (service) {
            return service;
          }
        }
      } catch (cacheError) {
      }
      
      return null;
    }
  },

  async updateService(id: string, serviceData: UpdateServiceData): Promise<Service | null> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await api.put(`/services/${id}`, serviceData);
      
      let updatedService = null;
      if (response.data && response.data.service) {
        updatedService = response.data.service;
      } else if (response.data && response.data.id) {
        updatedService = response.data;
      } else {
        updatedService = response.data;
      }
      
      await this.updateLocalServicesCache(updatedService, 'update');
      
      return updatedService;
    } catch (error) {
      throw new Error('Erro ao atualizar serviço: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async deleteService(id: string): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      await api.delete(`/services/${id}`);
      
      await this.updateLocalServicesCache({ id } as Service, 'delete');
      
      return true;
    } catch (error) {
      throw new Error('Erro ao deletar serviço: ' + 
        (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  },

  async getServiceCategories(): Promise<string[]> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const cachedCategories = await AsyncStorage.getItem('cachedServiceCategories');
      
      try {
        const response = await api.get('/services/categories');
        
        let categories = [];
        if (response.data && Array.isArray(response.data)) {
          categories = response.data;
        } else if (response.data && response.data.categories && Array.isArray(response.data.categories)) {
          categories = response.data.categories;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          categories = response.data.data;
        }
        
        await AsyncStorage.setItem('cachedServiceCategories', JSON.stringify(categories));
        
        return categories;
      } catch (apiError) {
        if (cachedCategories) {
          const categories = JSON.parse(cachedCategories);
          return categories;
        }
        
        const defaultCategories = [
          'Instalação Elétrica',
          'Manutenção',
          'Projeto Elétrico',
          'Automação',
          'Iluminação',
          'SPDA',
          'Energia Solar',
          'Outros'
        ];
        
        return defaultCategories;
      }
    } catch (error) {
      return [];
    }
  },

  async updateLocalServicesCache(service: Service, operation: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      const cachedServices = await AsyncStorage.getItem('cachedServices');
      if (!cachedServices) return;
      
      let services = JSON.parse(cachedServices);
      
      switch (operation) {
        case 'create':
          services.push(service);
          break;
          
        case 'update':
          const updateIndex = services.findIndex((s: Service) => s.id === service.id);
          if (updateIndex !== -1) {
            services[updateIndex] = { ...services[updateIndex], ...service };
          }
          break;
          
        case 'delete':
          services = services.filter((s: Service) => s.id !== service.id);
          break;
      }
      
      await AsyncStorage.setItem('cachedServices', JSON.stringify(services));
    } catch (error) {
    }
  },

  async clearServicesCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem('cachedServices');
      await AsyncStorage.removeItem('cachedServiceCategories');
    } catch (error) {
    }
  },

  validateService(serviceData: CreateServiceData): { isValid: boolean; error?: string } {
    if (!serviceData.name || serviceData.name.trim() === '') {
      return { isValid: false, error: 'Nome do serviço é obrigatório' };
    }
    
    if (!serviceData.price || serviceData.price <= 0) {
      return { isValid: false, error: 'Preço deve ser maior que zero' };
    }
    
    if (!serviceData.unit) {
      return { isValid: false, error: 'Unidade é obrigatória' };
    }
    
    const validUnits: ServiceUnit[] = ['UNIT', 'METER'];
    if (!validUnits.includes(serviceData.unit)) {
      return { isValid: false, error: 'Unidade inválida. Use apenas UNIT ou METER' };
    }
    
    return { isValid: true };
  },

  async getServicesByCategory(category: string): Promise<Service[]> {
    try {
      const allServices = await this.getServices();
      return allServices.filter(service => service.category === category);
    } catch (error) {
      return [];
    }
  },

  async searchServices(searchTerm: string): Promise<Service[]> {
    try {
      const allServices = await this.getServices();
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return allServices.filter(service => 
        service.name.toLowerCase().includes(lowercaseSearch) ||
        (service.description && service.description.toLowerCase().includes(lowercaseSearch)) ||
        (service.category && service.category.toLowerCase().includes(lowercaseSearch))
      );
    } catch (error) {
      return [];
    }
  }
};