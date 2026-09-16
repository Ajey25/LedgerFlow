import express from "express";

import {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
} from "../controllers/materialController.js";

const router = express.Router();

router.post("/", createMaterial);

router.get("/", getMaterials);

router.get("/:id", getMaterialById);

router.put("/:id", updateMaterial);

router.delete("/:id", deleteMaterial);

export default router;
