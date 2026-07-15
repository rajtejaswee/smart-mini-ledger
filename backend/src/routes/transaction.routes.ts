import { Router } from "express";
import { create, list, summary, remove } from "../controllers/transaction.controller";
import { validateBody } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { createTransactionSchema } from "../validators/transaction.schema";

const router = Router();

// Every transaction route requires a logged-in user.
router.use(requireAuth);

router.get("/summary", summary); // before "/:id"-style routes
router.get("/", list);
router.post("/", validateBody(createTransactionSchema), create);
router.delete("/:id", remove);

export default router;
