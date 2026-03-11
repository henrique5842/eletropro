import express, { Router } from "express";
import { MaterialController } from "../../controllers/material/MaterialController";
import { authMiddleware } from "../../middlewares/Auth";

const router: Router = express.Router();

router.use(authMiddleware);

router.post("/", async (req, res) => {
  await MaterialController.createMaterial(req, res);
});

router.get("/", async (req, res) => {
  await MaterialController.getMaterials(req, res);
});

router.get("/stats", async (req, res) => {
  await MaterialController.getMaterialStats(req, res);
});

router.get("/categories", async (req, res) => {
  await MaterialController.getMaterialCategories(req, res);
});

router.get("/search", async (req, res) => {
  await MaterialController.searchMaterials(req, res);
});

router.get("/category/:category", async (req, res) => {
  await MaterialController.getMaterialsByCategory(req, res);
});

router.get("/:id", async (req, res) => {
  await MaterialController.getMaterialById(req, res);
});

router.put("/:id", async (req, res) => {
  await MaterialController.updateMaterial(req, res);
});

router.delete("/:id", async (req, res) => {
  await MaterialController.deleteMaterial(req, res);
});

export default router;
