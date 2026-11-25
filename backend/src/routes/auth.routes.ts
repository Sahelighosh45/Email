import { Router } from "express";
import { googleLogin, getMe } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/google", googleLogin);
router.get("/me", requireAuth, getMe);

export default router;
