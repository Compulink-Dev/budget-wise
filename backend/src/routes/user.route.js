import express from "express";
import User from "../models/user.models.js";
import { createUser, getUsers } from "../controllers/user.controller.js";

const router = express.Router();

// Create user
router.post("/", createUser);

// Get all users
router.get("/", getUsers);

export default router;
