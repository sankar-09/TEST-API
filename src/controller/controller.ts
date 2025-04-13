import express, { Request, Response } from "express";
import * as Service from "../service/service";

const router = express.Router();

// GET: /api/service
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await Service.getAllServices(req);
    res.json(users);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while fetching services." });
  }
});

// GET: /api/service/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await Service.getServiceById(req.params.id, req);
    if (!user) {
      res.status(404).json({
        message: `No records found with given id: ${req.params.id}`,
      });
    } else {
      res.json(user);
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred while fetching the service.",
    });
  }
});


// INSERT: /api/service/
router.post("/", async (req: Request, res: Response) => {
  try {
    const result = await Service.addService(req.body, req);
    res.status(201).json({
      message: "Inserted Successfully",
      userId: result.insertId,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred while inserting the service.",
    });
  }
});

// UPDATE: /api/service/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const result = await Service.EditService(req.body, req.params.id, req);
    if (result.affectedRows === 0) {
      res.status(404).json({
        message: `No records found with given id: ${req.params.id}`,
      });
    } else {
      res.status(200).json({ message: "Updated Successfully" });
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred while updating the service.",
    });
  }
});

export default router;
