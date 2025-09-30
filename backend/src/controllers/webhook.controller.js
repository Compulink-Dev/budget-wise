// controllers/webhook.controller.js
import { verifyWebhookSignature } from "../config/webhookVerfication.js";
import User from "../models/user.models.js";

export const clerkWebhook = async (req, res) => {
  try {
    // For raw body, we need to parse it manually
    const payload = req.body.toString();
    const webhookData = JSON.parse(payload);

    const { type, data } = webhookData;

    console.log("Webhook received - Type:", type);
    console.log("Webhook data:", data);

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, req.headers)) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    if (type === "user.created" || type === "user.updated") {
      const { id, email_addresses, username, first_name, last_name } = data;

      // Extract email from email_addresses array
      const primaryEmail = email_addresses.find(
        (email) => email.id === data.primary_email_address_id
      );
      const email = primaryEmail
        ? primaryEmail.email_address
        : email_addresses[0]?.email_address;

      if (!email) {
        console.error("No email found in webhook data");
        return res.status(400).json({ message: "No email provided" });
      }

      // Check if user already exists in MongoDB
      let user = await User.findOne({ clerkId: id });

      if (user) {
        // Update existing user
        user.email = email;
        user.username = username || user.username;
        user.name =
          `${first_name || ""} ${last_name || ""}`.trim() || user.name;
        await user.save();
        console.log("User updated in MongoDB:", user._id);
      } else {
        // Create new user - NOTE: Remove password field since Clerk handles auth
        user = await User.create({
          clerkId: id,
          email: email,
          username: username,
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          // Remove password field - Clerk handles authentication
        });
        console.log("User created in MongoDB:", user._id);
      }

      return res.status(200).json({
        message: "Webhook processed successfully",
        userId: user._id,
      });
    }

    console.log("Webhook type not handled:", type);
    res.status(200).json({ message: "Webhook received but no action taken" });
  } catch (error) {
    console.error("Webhook error:", error);
    res
      .status(500)
      .json({ message: "Webhook processing failed", error: error.message });
  }
};
