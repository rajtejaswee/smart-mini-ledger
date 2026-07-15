import { Router } from "express";
import { confidence, burn, velocity, replay } from "../controllers/insights.controller";
import { validateBody } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { confidenceSchema } from "../validators/insights.schema";

const router = Router();

router.use(requireAuth);

router.post("/confidence", validateBody(confidenceSchema), confidence);
router.get("/burn", burn);
router.get("/velocity", velocity);
router.get("/replay", replay);

export default router;
