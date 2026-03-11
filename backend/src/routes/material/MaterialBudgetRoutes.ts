import express, { Router } from "express";
import { MaterialListController } from "../../controllers/material/MaterialBudgetController";
import { authMiddleware } from "../../middlewares/Auth";

const router: Router = express.Router();

router.use(authMiddleware);

router.post("/", async (req, res) => {
  await MaterialListController.createMaterialList(req, res);
});

router.get("/", async (req, res) => {
  await MaterialListController.getMaterialLists(req, res);
});

router.get("/stats", async (req, res) => {
  await MaterialListController.getMaterialListStats(req, res);
});

router.get("/summary", async (req, res) => {
  await MaterialListController.getMaterialListSummary(req, res);
});

router.get("/client/:clientId", async (req, res) => {
  await MaterialListController.getMaterialListsByClient(req, res);
});

router.get("/budget/:budgetId", async (req, res) => {
  await MaterialListController.getMaterialListsByBudget(req, res);
});

router.get("/status/:status", async (req, res) => {
  await MaterialListController.getMaterialListsByStatus(req, res);
});

router.get("/:id", async (req, res) => {
  await MaterialListController.getMaterialListById(req, res);
});

router.put("/:id", async (req, res) => {
  await MaterialListController.updateMaterialList(req, res);
});

router.delete("/:id", async (req, res) => {
  await MaterialListController.deleteMaterialList(req, res);
});

router.patch("/:id/status", async (req, res) => {
  await MaterialListController.updateMaterialListStatus(req, res);
});

router.post("/:id/duplicate", async (req, res) => {
  await MaterialListController.duplicateMaterialList(req, res);
});

router.post("/:id/items", async (req, res) => {
  await MaterialListController.addMaterialListItem(req, res);
});

router.put("/:id/items/:itemId", async (req, res) => {
  await MaterialListController.updateMaterialListItem(req, res);
});

router.delete("/:id/items/:itemId", async (req, res) => {
  await MaterialListController.removeMaterialListItem(req, res);
});

router.post("/from-budget/:budgetId", async (req, res) => {
  await MaterialListController.createMaterialListFromBudget(req, res);
});

export default router;
