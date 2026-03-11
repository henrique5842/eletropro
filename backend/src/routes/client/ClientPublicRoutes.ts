import express, { Router } from 'express';
import { ClientController } from '../../controllers/client/ClientController';

const router: Router = express.Router();

router.get('/:accessLink', async (req, res) => {
  await ClientController.getClientByPublicLink(req, res);
});

router.post('/:accessLink/budgets/:budgetId/approve', async (req, res) => {
  await ClientController.approveBudgetPublic(req, res);
});


router.post('/:accessLink/budgets/:budgetId/reject', async (req, res) => {
  await ClientController.rejectBudgetPublic(req, res);
});

router.get('/:accessLink/material-lists', async (req, res) => {
  await ClientController.getMaterialListsPublic(req, res);
});

router.get('/:accessLink/material-lists/:materialListId', async (req, res) => {
  await ClientController.getMaterialListDetailsPublic(req, res);
});

router.post('/:accessLink/material-lists/:materialListId/approve', async (req, res) => {
  await ClientController.approveMaterialListPublic(req, res);
});

router.post('/:accessLink/material-lists/:materialListId/reject', async (req, res) => {
  await ClientController.rejectMaterialListPublic(req, res);
});

router.get('/utils/cep', async (req, res) => {
  await ClientController.searchAddressByCEP(req, res);
});

export default router;