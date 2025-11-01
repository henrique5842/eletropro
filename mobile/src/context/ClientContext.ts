import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

interface Client {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  cpfCnpj?: string;
  requiresInvoice: boolean;
  publicLink?: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  totalValue: number;
  clientSince: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateClientData {
  fullName: string;
  phone: string;
  email?: string;
  cpfCnpj?: string;
  requiresInvoice: boolean;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface UpdateClientData extends Partial<CreateClientData> {
  totalValue?: number;
}

interface ClientStats {
  totalClients: number;
  totalValue: number;
  recentClients: number;
  activeProjects: number;
}

export const clientContext = {
  async createClient(clientData: CreateClientData): Promise<Client> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await api.post("/clients", clientData);

      await this.refreshClientsCache();

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao criar cliente: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async getClients(): Promise<Client[]> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("Usuário não autenticado");

      const response = await api.get("/clients");

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao buscar clientes: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async getClientById(id: string): Promise<Client> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await api.get(`/clients/${id}`);

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao buscar cliente: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async updateClient(
    id: string,
    clientData: UpdateClientData
  ): Promise<Client> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await api.put(`/clients/${id}`, clientData);

      await this.clearClientsCache();

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao atualizar cliente: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async deleteClient(id: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      await api.delete(`/clients/${id}`);

      await this.clearClientsCache();
    } catch (error) {
      throw new Error(
        "Erro ao excluir cliente: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async getClientStats(): Promise<ClientStats> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await api.get("/clients/stats");

      return response.data;
    } catch (error) {
      throw new Error(
        "Erro ao buscar estatísticas: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async refreshClientsCache(): Promise<void> {
    try {
      const clients = await this.getClients();
    } catch (error) {
    }
  },

  async clearClientsCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem("clientsCache");
      await AsyncStorage.removeItem("clientsCacheTimestamp");
    } catch (error) {
    }
  },

  validateClientData(clientData: CreateClientData): {
    isValid: boolean;
    error?: string;
  } {
    if (!clientData.fullName || clientData.fullName.trim().length < 2) {
      return {
        isValid: false,
        error: "Nome completo deve ter pelo menos 2 caracteres",
      };
    }

    if (!clientData.phone || clientData.phone.length < 10) {
      return {
        isValid: false,
        error: "Telefone deve ter pelo menos 10 dígitos",
      };
    }

    if (clientData.email && !/\S+@\S+\.\S+/.test(clientData.email)) {
      return { isValid: false, error: "Email deve ter um formato válido" };
    }

    if (!clientData.cep || clientData.cep.length < 8) {
      return { isValid: false, error: "CEP deve ter 8 dígitos" };
    }

    if (!clientData.street || clientData.street.trim().length < 3) {
      return {
        isValid: false,
        error: "Endereço deve ter pelo menos 3 caracteres",
      };
    }

    if (!clientData.number || clientData.number.trim().length < 1) {
      return { isValid: false, error: "Número é obrigatório" };
    }

    if (!clientData.neighborhood || clientData.neighborhood.trim().length < 2) {
      return {
        isValid: false,
        error: "Bairro deve ter pelo menos 2 caracteres",
      };
    }

    if (!clientData.city || clientData.city.trim().length < 2) {
      return {
        isValid: false,
        error: "Cidade deve ter pelo menos 2 caracteres",
      };
    }

    if (!clientData.state || clientData.state.length !== 2) {
      return { isValid: false, error: "Estado deve ter 2 caracteres (UF)" };
    }

    return { isValid: true };
  },

  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  },

  formatCEP(cep: string): string {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2");
    }
    return cep;
  },

  formatCPFCNPJ(document: string): string {
    const cleaned = document.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (cleaned.length === 14) {
      return cleaned.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }
    return document;
  },

  async searchAddressByCEP(cep: string): Promise<{
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }> {
    try {
      const cleanCEP = cep.replace(/\D/g, "");
      if (cleanCEP.length !== 8) {
        throw new Error("CEP deve ter 8 dígitos");
      }

      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCEP}/json/`
      );
      const data = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado");
      }

      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      };
    } catch (error) {
      throw new Error(
        "Erro ao buscar endereço: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },
};