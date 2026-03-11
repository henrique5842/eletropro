import express, { Router } from 'express';
import { BudgetController } from '../../controllers/budget/BudgetController';
import { authMiddleware } from '../../middlewares/Auth';

const router: Router = express.Router();

// Todas as rotas são protegidas
router.use(authMiddleware);

// Rotas principais de CRUD
router.post('/', async (req, res) => {
  await BudgetController.createBudget(req, res);
});

router.get('/', async (req, res) => {
  await BudgetController.getBudgets(req, res);
});

router.get('/stats', async (req, res) => {
  await BudgetController.getBudgetStats(req, res);
});

router.get('/summary', async (req, res) => {
  await BudgetController.getBudgetSummary(req, res);
});

// Rotas específicas
router.get('/client/:clientId', async (req, res) => {
  await BudgetController.getBudgetsByClient(req, res);
});

router.get('/status/:status', async (req, res) => {
  await BudgetController.getBudgetsByStatus(req, res);
});

// Rotas por ID
router.get('/:id', async (req, res) => {
  await BudgetController.getBudgetById(req, res);
});

router.put('/:id', async (req, res) => {
  await BudgetController.updateBudget(req, res);
});

router.delete('/:id', async (req, res) => {
  await BudgetController.deleteBudget(req, res);
});

// Rotas de status e descontos
router.patch('/:id/status', async (req, res) => {
  await BudgetController.updateBudgetStatus(req, res);
});

router.patch('/:id/discount', async (req, res) => {
  await BudgetController.applyDiscount(req, res);
});

router.delete('/:id/discount', async (req, res) => {
  await BudgetController.removeDiscount(req, res);
});

// Rotas de duplicação
router.post('/:id/duplicate', async (req, res) => {
  await BudgetController.duplicateBudget(req, res);
});

// Rotas de itens do orçamento
router.post('/:id/items', async (req, res) => {
  await BudgetController.addBudgetItem(req, res);
});

router.put('/:id/items/:itemId', async (req, res) => {
  await BudgetController.updateBudgetItem(req, res);
});

router.delete('/:id/items/:itemId', async (req, res) => {
  await BudgetController.removeBudgetItem(req, res);
});

export default router;