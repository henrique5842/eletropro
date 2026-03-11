import { Request, Response } from "express";
import {
  MaterialService,
  CreateMaterialData,
  UpdateMaterialData,
} from "../../services/material/MaterialServices";

export class MaterialController {
  static async createMaterial(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const materialData: CreateMaterialData = req.body;

      const validation = MaterialService.validateMaterialData(materialData);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const material = await MaterialService.createMaterial(
        userId,
        materialData
      );
      return res.status(201).json({ material });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getMaterials(req: Request, res: Response) {
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

      const result = await MaterialService.getMaterials(userId, filters);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getMaterialById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const material = await MaterialService.getMaterialById(userId, id);
      return res.status(200).json({ material });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async updateMaterial(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const materialData: UpdateMaterialData = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const updatedMaterial = await MaterialService.updateMaterial(
        userId,
        id,
        materialData
      );
      return res.status(200).json({ material: updatedMaterial });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async deleteMaterial(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      await MaterialService.deleteMaterial(userId, id);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getMaterialStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const stats = await MaterialService.getMaterialStats(userId);
      return res.status(200).json(stats);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getMaterialCategories(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const categories = await MaterialService.getMaterialCategories(userId);
      return res.status(200).json({ categories });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async searchMaterials(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { q } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Termo de busca é obrigatório" });
      }

      const materials = await MaterialService.searchMaterials(userId, q);
      return res.status(200).json({ materials });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getMaterialsByCategory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { category } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const materials = await MaterialService.getMaterialsByCategory(
        userId,
        category
      );
      return res.status(200).json({ materials });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
