import { Request, Response } from "express";
import { materialListService } from "../../services/material/MaterialBudgetServices";
import { MaterialListStatus } from "@prisma/client";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

export class MaterialListController {
  static async createMaterialList(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const materialListData = {
        ...req.body,
        userId: professionalId,
      };

      const materialList = await materialListService.createMaterialList(
        materialListData
      );
      res.status(201).json(materialList);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar lista de materiais",
      });
    }
  }

  static async getMaterialLists(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const filters = {
        clientId: req.query.clientId as string,
        status: req.query.status as MaterialListStatus,
        search: req.query.search as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        budgetId: req.query.budgetId as string,
      };

      const materialLists = await materialListService.listMaterialLists(
        professionalId,
        filters
      );
      res.json(materialLists);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao listar listas de materiais",
      });
    }
  }

  static async getMaterialListById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { id } = req.params;

      const materialList = await materialListService.getMaterialListById(
        id,
        professionalId
      );
      res.json(materialList);
    } catch (error) {
      res.status(404).json({
        error:
          error instanceof Error
            ? error.message
            : "Lista de materiais não encontrada",
      });
    }
  }

  static async updateMaterialList(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { id } = req.params;

      const materialList = await materialListService.updateMaterialList(
        id,
        professionalId,
        req.body
      );
      res.json(materialList);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar lista de materiais",
      });
    }
  }

  static async updateMaterialListStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      const materialList = await materialListService.updateMaterialListStatus(
        id,
        professionalId,
        status
      );
      res.json(materialList);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao atualizar status",
      });
    }
  }

  static async deleteMaterialList(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { id } = req.params;

      await materialListService.deleteMaterialList(id, professionalId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao deletar lista de materiais",
      });
    }
  }

  static async addMaterialListItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { id } = req.params;

      const item = await materialListService.addMaterialListItem(
        id,
        professionalId,
        req.body
      );
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao adicionar item",
      });
    }
  }

  static async updateMaterialListItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { id, itemId } = req.params;

      const item = await materialListService.updateMaterialListItem(
        id,
        itemId,
        professionalId,
        req.body
      );
      res.json(item);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao atualizar item",
      });
    }
  }

  static async removeMaterialListItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { id, itemId } = req.params;

      await materialListService.removeMaterialListItem(
        id,
        itemId,
        professionalId
      );
      res.status(204).send();
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao remover item",
      });
    }
  }

  static async duplicateMaterialList(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { id } = req.params;
      const { name } = req.body;

      const materialList = await materialListService.duplicateMaterialList(
        id,
        professionalId,
        name
      );
      res.status(201).json(materialList);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao duplicar lista de materiais",
      });
    }
  }

  static async getMaterialListsByClient(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { clientId } = req.params;

      const materialLists = await materialListService.getMaterialListsByClient(
        clientId,
        professionalId
      );
      res.json(materialLists);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar listas de materiais",
      });
    }
  }

  static async getMaterialListsByBudget(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { budgetId } = req.params;

      const materialLists = await materialListService.getMaterialListsByBudget(
        budgetId,
        professionalId
      );
      res.json(materialLists);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar listas de materiais",
      });
    }
  }

  static async getMaterialListsByStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { status } = req.params;

      const materialLists = await materialListService.getMaterialListsByStatus(
        status as MaterialListStatus,
        professionalId
      );
      res.json(materialLists);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar listas de materiais",
      });
    }
  }

  static async getMaterialListSummary(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;

      const summary = await materialListService.getMaterialListSummary(
        professionalId
      );
      res.json(summary);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao gerar resumo",
      });
    }
  }

  static async getMaterialListStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;

      const stats = await materialListService.getMaterialListStats(
        professionalId
      );
      res.json(stats);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar estatísticas",
      });
    }
  }

  static async createMaterialListFromBudget(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const professionalId = req.user.id;
      const { budgetId } = req.params;
      const { name } = req.body;

      const materialList =
        await materialListService.createMaterialListFromBudget(
          budgetId,
          professionalId,
          name
        );
      res.status(201).json(materialList);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar lista de materiais a partir do orçamento",
      });
    }
  }
}
