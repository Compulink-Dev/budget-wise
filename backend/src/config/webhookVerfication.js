// utils/webhookVerification.js
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export const verifyWebhookSignature = (payload, headers) => {
  const whSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!whSecret) {
    console.warn("CLERK_WEBHOOK_SECRET not set, skipping verification");
    return true;
  }

  const svixId = headers["svix-id"];
  const svixTimestamp = headers["svix-timestamp"];
  const svixSignature = headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", whSecret)
    .update(signedContent)
    .digest("hex");

  return expectedSignature === svixSignature;
};
