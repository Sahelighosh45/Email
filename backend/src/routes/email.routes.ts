import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  getEmails,
  getEmailById,
  scheduleBulkEmails,
} from "../controllers/email.controller";

const router = Router();

// Dashboard
router.get("/", requireAuth, getEmails);

// Email detail
router.get("/:id", requireAuth, getEmailById);

// Bulk schedule (core requirement)
router.post("/bulk", requireAuth, scheduleBulkEmails);

export default router;
