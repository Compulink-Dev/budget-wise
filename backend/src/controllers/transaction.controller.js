import Transaction from "../models/transcation.model.js";
import mongoose from "mongoose";

export const createTransaction = async (req, res) => {
  try {
    const { userId, title, amount, category } = req.body;

    if (!title || !userId || !category || amount === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const transaction = await Transaction.create({
      userId,
      title,
      amount,
      category,
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.log("Error creating the transaction : ", error);

    res.status(400).json({ message: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// controller
export const getTransactionsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const transactions = await Transaction.find({ userId }); // ✅ search by userId

    if (!transactions || transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this user" });
    }

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { title, amount, category } = req.body;

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { title, amount, category },
      { new: true, runValidators: true } // return updated doc, validate schema
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactionSummary = async (req, res) => {
  const { userId } = req.params;

  try {
    // Remove MongoDB ObjectId validation since Clerk userIds are strings
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const summary = await Transaction.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          balance: { $sum: "$amount" },
          income: {
            $sum: {
              $cond: [
                { $eq: ["$category", "income"] }, // If category is "income"
                "$amount",
                0,
              ],
            },
          },
          expenses: {
            $sum: {
              $cond: [
                { $eq: ["$category", "expenses"] }, // If category is "expenses"
                "$amount",
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          balance: 1,
          income: 1,
          expenses: 1,
        },
      },
    ]);

    // If no transactions found, return zeros
    const result =
      summary.length > 0
        ? summary[0]
        : {
            balance: 0,
            income: 0,
            expenses: 0,
          };

    res.status(200).json(result);
  } catch (error) {
    console.log("Error getting the summary ", error);
    res.status(500).json({ message: error.message });
  }
};
