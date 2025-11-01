import { Request, Response } from "express";
import {
  ServiceService,
  CreateServiceData,
  UpdateServiceData,
} from "../../services/service/Service";

export class ServiceController {
  static async createService(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const serviceData: CreateServiceData = req.body;

      const validation = ServiceService.validateServiceData(serviceData);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const service = await ServiceService.createService(userId, serviceData);
      return res.status(201).json({ service });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getServices(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const { search, category, page, limit } = req.query;

      const filters = {
        search: search as string,
        category: category as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      };

      const result = await ServiceService.getServices(userId, filters);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getServiceById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const service = await ServiceService.getServiceById(userId, id);
      return res.status(200).json({ service });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async updateService(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const serviceData: UpdateServiceData = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const updatedService = await ServiceService.updateService(
        userId,
        id,
        serviceData
      );
      return res.status(200).json({ service: updatedService });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async deleteService(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      await ServiceService.deleteService(userId, id);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getServiceStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const stats = await ServiceService.getServiceStats(userId);
      return res.status(200).json(stats);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getServiceCategories(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const categories = await ServiceService.getServiceCategories(userId);
      return res.status(200).json({ categories });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async searchServices(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { q } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Termo de busca é obrigatório" });
      }

      const services = await ServiceService.searchServices(userId, q);
      return res.status(200).json({ services });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getServicesByCategory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { category } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const services = await ServiceService.getServicesByCategory(
        userId,
        category
      );
      return res.status(200).json({ services });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
