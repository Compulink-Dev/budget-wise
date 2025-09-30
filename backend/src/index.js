import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoutes from "./routes/user.route.js";
import transactionRoutes from "./routes/transaction.route.js";
import ratelimiter from "./middlewares/rate_limiter.js";
import webhookRoutes from "./routes/webhook.route.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

console.log("Port :", PORT);

connectDB();

const app = express();

//middleware
app.use(ratelimiter);
app.use(express.json());
// Webhook route (must come before other middleware)
app.use("/webhook", webhookRoutes);

app.get("/", (req, res) => {
  res.send("Hello");
});

// Use user routes with a base path
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);

app.listen(PORT, () => {
  console.log("Server started at : ", PORT);
});
