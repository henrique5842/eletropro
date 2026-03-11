import express, { Router } from "express";
import { ClientController } from "../../controllers/client/ClientController";
import { authMiddleware } from "../../middlewares/Auth";

const router: Router = express.Router();

router.use(authMiddleware);

router.get("/stats", async (req, res) => {
  await ClientController.getClientStats(req, res);
});

router.post("/", async (req, res) => {
  await ClientController.createClient(req, res);
});

router.get("/", async (req, res) => {
  await ClientController.getClients(req, res);
});

router.get("/:id", async (req, res) => {
  await ClientController.getClientById(req, res);
});

router.put("/:id", async (req, res) => {
  await ClientController.updateClient(req, res);
});

router.delete("/:id", async (req, res) => {
  await ClientController.deleteClient(req, res);
});

router.patch("/:id/deactivate", async (req, res) => {
  await ClientController.deactivateClient(req, res);
});

router.patch("/:id/activate", async (req, res) => {
  await ClientController.activateClient(req, res);
});

router.patch("/:id/regenerate-link", async (req, res) => {
  await ClientController.regeneratePublicLink(req, res);
});

export default router;
