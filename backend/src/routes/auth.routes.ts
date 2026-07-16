import { Router } from "express";
import { register, login, me, updateMe, changePassword } from "../controllers/auth.controller";
import { validateBody } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { credentialLimiter } from "../middlewares/rateLimit";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/auth.schema";

const router = Router();

router.post("/register", credentialLimiter, validateBody(registerSchema), register);
router.post("/login", credentialLimiter, validateBody(loginSchema), login);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, validateBody(updateProfileSchema), updateMe);
router.post(
  "/change-password",
  credentialLimiter,
  requireAuth,
  validateBody(changePasswordSchema),
  changePassword
);

export default router;
