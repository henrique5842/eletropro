// routes/authRoutes.ts
import express, { Router } from 'express';
import { AuthController } from '../../controllers/users/AuthController';
import { authMiddleware } from '../../middlewares/Auth';

const router: Router = express.Router();

// Rotas públicas
router.post('/register', async (req, res) => {
  await AuthController.register(req, res);
});

router.post('/login', async (req, res) => {
  await AuthController.login(req, res);
});

router.post('/check-email-availability', async (req, res) => {
  await AuthController.checkEmailAvailability(req, res);
});

router.post('/check-email', async (req, res) => {
  await AuthController.checkEmailExists(req, res);
});

router.post('/check-reset-code', async (req, res) => {
  await AuthController.checkResetCode(req, res);
});

router.post('/forgot-password', async (req, res) => {
  await AuthController.requestPasswordReset(req, res);
});

router.post('/verify-reset-code', async (req, res) => {
  await AuthController.verifyResetCode(req, res);
});

router.post('/reset-password', async (req, res) => {
  await AuthController.resetPassword(req, res);
});

// Rotas protegidas
router.use(authMiddleware);

router.get('/profile', async (req, res) => {
  await AuthController.getProfile(req, res);
});

router.put('/profile', async (req, res) => {
  await AuthController.updateProfile(req, res);
});

export default router;