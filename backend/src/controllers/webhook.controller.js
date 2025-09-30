// controllers/webhook.controller.js
import { verifyWebhookSignature } from "../config/webhookVerfication.js";
import User from "../models/user.models.js";
import crypto from "crypto";

export const clerkWebhook = async (req, res) => {
  try {
    // Verify the webhook signature (important for security)
    const svixId = req.headers["svix-id"];
    const svixTimestamp = req.headers["svix-timestamp"];
    const svixSignature = req.headers["svix-signature"];

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ message: "Missing Svix headers" });
    }

    const payload = JSON.stringify(req.body);

    // You should verify the webhook signature here using your webhook secret
    // For now, we'll skip verification in development
    if (!verifyWebhookSignature(payload, req.headers)) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const { type, data } = req.body;

    if (type === "user.created" || type === "user.updated") {
      const { id, email_addresses, username, first_name, last_name } = data;

      // Extract email from email_addresses array
      const primaryEmail = email_addresses.find(
        (email) => email.id === data.primary_email_address_id
      );
      const email = primaryEmail
        ? primaryEmail.email_address
        : email_addresses[0]?.email_address;

      // Check if user already exists in MongoDB
      let user = await User.findOne({ clerkId: id });

      if (user) {
        // Update existing user
        user.email = email;
        user.username = username;
        user.name = `${first_name || ""} ${last_name || ""}`.trim();
        await user.save();
        console.log("User updated in MongoDB:", user._id);
      } else {
        // Create new user
        user = await User.create({
          clerkId: id,
          email: email,
          username: username,
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          // Add any other fields you need
        });
        console.log("User created in MongoDB:", user._id);
      }

      return res
        .status(200)
        .json({ message: "Webhook processed successfully" });
    }

    res.status(200).json({ message: "Webhook received but no action taken" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
