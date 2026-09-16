import express from "express";

import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController.js";

const router = express.Router();

// Create company
router.post("/", createCompany);

// Get all companies
router.get("/", getCompanies);

// Get single company
router.get("/:id", getCompanyById);

// Update company
router.put("/:id", updateCompany);

// Delete company
router.delete("/:id", deleteCompany);

export default router;
