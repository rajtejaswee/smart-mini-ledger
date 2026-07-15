import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { validateBody } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { registerSchema, loginSchema } from "../validators/auth.schema";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;
