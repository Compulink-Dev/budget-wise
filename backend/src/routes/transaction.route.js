import express from "express";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  getTransactionsByUser,
  getTransactionSummary,
  updateTransaction,
} from "../controllers/transaction.controller.js";

const router = express.Router();

// Get all transactions
router.get("/", getTransactions);

// Get transaction by id
router.get("/:id", getTransaction);

// Get transaction by userId
router.get("/user/:userId", getTransactionsByUser);

// Get transaction summary by user id
router.get("/summary/:userId", getTransactionSummary);

// Create transaction
router.post("/", createTransaction);

// Update transaction by ID
router.put("/:id", updateTransaction);

//  Delete transaction by ID
router.delete("/:id", deleteTransaction);

export default router;
