import Material from "../models/Material.js";

// CREATE MATERIAL
export const createMaterial = async (req, res) => {
  try {
    const { desc, hsn, rate, per } = req.body;

    if (!desc || !hsn || rate === undefined || !per) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const material = await Material.create({
      desc,
      hsn,
      rate,
      per,
    });

    res.status(201).json({
      message: "Material created successfully",
      data: material,
    });
  } catch (error) {
    console.error("Create material error:", error);

    res.status(500).json({
      message: "Failed to create material",
      error: error.message,
    });
  }
};

// GET ALL MATERIALS
export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({
      desc: 1,
    });

    res.status(200).json({
      message: "Materials fetched successfully",
      data: materials,
    });
  } catch (error) {
    console.error("Get materials error:", error);

    res.status(500).json({
      message: "Failed to fetch materials",
      error: error.message,
    });
  }
};

// GET SINGLE MATERIAL
export const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    res.status(200).json({
      message: "Material fetched successfully",
      data: material,
    });
  } catch (error) {
    console.error("Get material error:", error);

    res.status(500).json({
      message: "Failed to fetch material",
      error: error.message,
    });
  }
};

// UPDATE MATERIAL
export const updateMaterial = async (req, res) => {
  try {
    const { desc, hsn, rate, per } = req.body;

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      {
        desc,
        hsn,
        rate,
        per,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!material) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    res.status(200).json({
      message: "Material updated successfully",
      data: material,
    });
  } catch (error) {
    console.error("Update material error:", error);

    res.status(500).json({
      message: "Failed to update material",
      error: error.message,
    });
  }
};

// DELETE MATERIAL
export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);

    if (!material) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    res.status(200).json({
      message: "Material deleted successfully",
      data: material,
    });
  } catch (error) {
    console.error("Delete material error:", error);

    res.status(500).json({
      message: "Failed to delete material",
      error: error.message,
    });
  }
};
