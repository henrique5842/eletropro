import { Request, Response } from 'express';
import { budgetService } from '../../services/budget/BudgetServices';
import { BudgetStatus } from '@prisma/client';

// Extendendo a interface Request do Express
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

export class BudgetController {
  // Criar orçamento
  static async createBudget(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const budgetData = {
        ...req.body,
        userId: professionalId
      };

      const budget = await budgetService.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao criar orçamento' 
      });
    }
  }

  // Listar orçamentos com filtros
  static async getBudgets(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const filters = {
        clientId: req.query.clientId as string,
        status: req.query.status as BudgetStatus,
        search: req.query.search as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      };

      const budgets = await budgetService.listBudgets(professionalId, filters);
      res.json(budgets);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao listar orçamentos' 
      });
    }
  }

  // Buscar orçamento por ID
  static async getBudgetById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id } = req.params;

      const budget = await budgetService.getBudgetById(id, professionalId);
      res.json(budget);
    } catch (error) {
      res.status(404).json({ 
        error: error instanceof Error ? error.message : 'Orçamento não encontrado' 
      });
    }
  }

  // Atualizar orçamento
  static async updateBudget(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id } = req.params;

      const budget = await budgetService.updateBudget(id, professionalId, req.body);
      res.json(budget);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar orçamento' 
      });
    }
  }

  // Atualizar status do orçamento
  static async updateBudgetStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      const budget = await budgetService.updateBudgetStatus(id, professionalId, status);
      res.json(budget);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar status' 
      });
    }
  }

  // Aplicar desconto
  static async applyDiscount(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id } = req.params;
      const { discount, discountType, discountReason } = req.body;

      const budget = await budgetService.applyDiscount(
        id, 
        professionalId, 
        { discount, discountType, discountReason }
      );
      res.json(budget);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao aplicar desconto' 
      });
    }
  }

  // Remover desconto
  static async removeDiscount(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id } = req.params;

      const budget = await budgetService.removeDiscount(id, professionalId);
      res.json(budget);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao remover desconto' 
      });
    }
  }

  // Deletar orçamento
  static async deleteBudget(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id } = req.params;

      await budgetService.deleteBudget(id, professionalId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao deletar orçamento' 
      });
    }
  }

  // Adicionar item ao orçamento
  static async addBudgetItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id } = req.params;

      const item = await budgetService.addBudgetItem(id, professionalId, req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao adicionar item' 
      });
    }
  }

  // Atualizar item do orçamento
  static async updateBudgetItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id, itemId } = req.params;

      const item = await budgetService.updateBudgetItem(id, itemId, professionalId, req.body);
      res.json(item);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar item' 
      });
    }
  }

  // Remover item do orçamento
  static async removeBudgetItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id, itemId } = req.params;

      await budgetService.removeBudgetItem(id, itemId, professionalId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao remover item' 
      });
    }
  }

  // Duplicar orçamento
  static async duplicateBudget(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { id } = req.params;
      const { name } = req.body;

      const budget = await budgetService.duplicateBudget(id, professionalId, name);
      res.status(201).json(budget);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao duplicar orçamento' 
      });
    }
  }

  // Buscar orçamentos por cliente
  static async getBudgetsByClient(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { clientId } = req.params;

      const budgets = await budgetService.getBudgetsByClient(clientId, professionalId);
      res.json(budgets);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao buscar orçamentos' 
      });
    }
  }

  // Buscar orçamentos por status
  static async getBudgetsByStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;
      const { status } = req.params;

      const budgets = await budgetService.getBudgetsByStatus(status as BudgetStatus, professionalId);
      res.json(budgets);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao buscar orçamentos' 
      });
    }
  }

  // Gerar resumo de orçamentos
  static async getBudgetSummary(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;

      const summary = await budgetService.getBudgetSummary(professionalId);
      res.json(summary);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar resumo' 
      });
    }
  }

  // Buscar estatísticas de uso (similar ao stats do material)
  static async getBudgetStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const professionalId = req.user.id;

      const stats = await budgetService.getBudgetStats(professionalId);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas' 
      });
    }
  }
}