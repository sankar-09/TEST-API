import express, { Request, Response } from "express";
import * as Service from "../service/service";

const router = express.Router();

// GET: /api/user
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await Service.getAllUsers(req);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
});

// GET: /api/user/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await Service.getUserById(req.params.id, req);
    if (!user) {
      res
        .status(404)
        .json({ message: `No records found with given id: ${req.params.id}` });
    } else {
      res.json(user);
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the user." });
  }
});

// DELETE: /api/user/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await Service.deleteUserById(req.params.id, req);
    if (result.affectedRows === 0) {
      res
        .status(404)
        .json({ message: `No records found with given id: ${req.params.id}` });
    } else {
      res.status(200).json({ message: "Deleted successfully" });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the user." });
  }
});

// INSERT: /api/user/
router.post("/", async (req: Request, res: Response) => {
  try {
    const result = await Service.addUser(req.body, req);
    res
      .status(201)
      .json({ message: "Inserted Successfully", userId: result.insertId });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while inserting the user." });
  }
});

// UPDATE: /api/user/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const result = await Service.EditUser(req.body, req.params.id, req);
    res.status(200).json({ message: "Updated Successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while updating the user." });
  }
});

export default router;
