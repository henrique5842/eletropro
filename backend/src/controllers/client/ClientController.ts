import { Request, Response } from "express";
import {
  ClientService,
  CreateClientData,
  UpdateClientData,
} from "../../services/client/ClientServices";

export class ClientController {
  static async createClient(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const clientData: CreateClientData = req.body;

      const validation = ClientService.validateClientData(clientData);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const client = await ClientService.createClient(userId, clientData);
      return res.status(201).json(client);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getClients(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const { search, isActive, page, limit } = req.query;

      const filters = {
        search: search as string,
        isActive: isActive ? isActive === "true" : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 100,
      };

      const result = await ClientService.getClients(userId, filters);

      return res.status(200).json(result.clients);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getClientById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const client = await ClientService.getClientById(userId, id);
      return res.status(200).json(client);
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      if (error instanceof Error) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getClientByPublicLink(req: Request, res: Response) {
    try {
      const { accessLink } = req.params;
      console.log("Buscando cliente com accessLink:", accessLink);

      const client = await ClientService.getClientByPublicLink(accessLink);
      return res.status(200).json(client);
    } catch (error) {
      console.error("Erro ao buscar cliente por link público:", error);
      if (error instanceof Error) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async approveBudgetPublic(req: Request, res: Response) {
    try {
      const { accessLink, budgetId } = req.params;
      const data = req.body;

      await ClientService.approveBudgetPublic(accessLink, budgetId, data);
      return res
        .status(200)
        .json({ message: "Orçamento aprovado com sucesso" });
    } catch (error) {
      console.error("Erro ao aprovar orçamento:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async rejectBudgetPublic(req: Request, res: Response) {
    try {
      const { accessLink, budgetId } = req.params;
      const data = req.body;

      await ClientService.rejectBudgetPublic(accessLink, budgetId, data);
      return res
        .status(200)
        .json({ message: "Orçamento rejeitado com sucesso" });
    } catch (error) {
      console.error("Erro ao rejeitar orçamento:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getMaterialListsPublic(req: Request, res: Response) {
    try {
      const { accessLink } = req.params;

      const result = await ClientService.getMaterialListsPublic(accessLink);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao buscar listas de materiais:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getMaterialListDetailsPublic(req: Request, res: Response) {
    try {
      const { accessLink, materialListId } = req.params;

      const result = await ClientService.getMaterialListDetailsPublic(
        accessLink,
        materialListId
      );
      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao buscar detalhes da lista de materiais:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async approveMaterialListPublic(req: Request, res: Response) {
    try {
      const { accessLink, materialListId } = req.params;
      const data = req.body;

      await ClientService.approveMaterialListPublic(
        accessLink,
        materialListId,
        data
      );
      return res
        .status(200)
        .json({ message: "Lista de materiais aprovada com sucesso" });
    } catch (error) {
      console.error("Erro ao aprovar lista de materiais:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async rejectMaterialListPublic(req: Request, res: Response) {
    try {
      const { accessLink, materialListId } = req.params;
      const data = req.body;

      await ClientService.rejectMaterialListPublic(
        accessLink,
        materialListId,
        data
      );
      return res
        .status(200)
        .json({ message: "Lista de materiais rejeitada com sucesso" });
    } catch (error) {
      console.error("Erro ao rejeitar lista de materiais:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async updateClient(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const clientData: UpdateClientData = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const updatedClient = await ClientService.updateClient(
        userId,
        id,
        clientData
      );
      return res.status(200).json(updatedClient);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async deleteClient(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      await ClientService.deleteClient(userId, id);
      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async deactivateClient(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const client = await ClientService.deactivateClient(userId, id);
      return res.status(200).json(client);
    } catch (error) {
      console.error("Erro ao desativar cliente:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async activateClient(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const client = await ClientService.activateClient(userId, id);
      return res.status(200).json(client);
    } catch (error) {
      console.error("Erro ao ativar cliente:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getClientStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const stats = await ClientService.getClientStats(userId);
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async regeneratePublicLink(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const client = await ClientService.regeneratePublicLink(userId, id);
      return res.status(200).json(client);
    } catch (error) {
      console.error("Erro ao regenerar link:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async searchAddressByCEP(req: Request, res: Response) {
    try {
      const { cep } = req.query;

      if (!cep || typeof cep !== "string") {
        return res.status(400).json({ error: "CEP é obrigatório" });
      }

      const cleanCEP = cep.replace(/\D/g, "");
      if (cleanCEP.length !== 8) {
        return res.status(400).json({ error: "CEP deve ter 8 dígitos" });
      }

      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCEP}/json/`
      );
      const data = await response.json();

      if (data.erro) {
        return res.status(404).json({ error: "CEP não encontrado" });
      }

      return res.status(200).json({
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      return res.status(500).json({ error: "Erro ao buscar endereço" });
    }
  }
}
