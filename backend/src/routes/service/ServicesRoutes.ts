// routes/serviceRoutes.ts
import express, { Router } from 'express';
import { ServiceController } from '../../controllers/service/ServicesController';
import { authMiddleware } from '../../middlewares/Auth';

const router: Router = express.Router();

// Todas as rotas são protegidas
router.use(authMiddleware);

// Rotas de CRUD
router.post('/', async (req, res) => {
  await ServiceController.createService(req, res);
});

router.get('/', async (req, res) => {
  await ServiceController.getServices(req, res);
});

router.get('/stats', async (req, res) => {
  await ServiceController.getServiceStats(req, res);
});

router.get('/categories', async (req, res) => {
  await ServiceController.getServiceCategories(req, res);
});

router.get('/search', async (req, res) => {
  await ServiceController.searchServices(req, res);
});

router.get('/category/:category', async (req, res) => {
  await ServiceController.getServicesByCategory(req, res);
});

router.get('/:id', async (req, res) => {
  await ServiceController.getServiceById(req, res);
});

router.put('/:id', async (req, res) => {
  await ServiceController.updateService(req, res);
});

router.delete('/:id', async (req, res) => {
  await ServiceController.deleteService(req, res);
});

export default router;