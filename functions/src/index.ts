import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";

export const healthCheck = onRequest({ cors: true }, (_req, res) => {
  logger.info("Health check invoked", { structuredData: true });
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
