import Router from "express";
import authRouter from "./auth/index.route.js";
import uploadUrlRouter from "./upload-url/index.route.js";
import feedRouter from "./feed/index.route.js";
import searchRouter from "./search/index.route.js";
import usersRouter from "./users/index.route.js";
import meRouter from "./me/index.route.js";

const router = Router();

// ============================================================================
// Komplex Routes
// ============================================================================
router.use("/auth", authRouter);
router.use("/upload", uploadUrlRouter);
router.use("/feed", feedRouter);
router.use("/search", searchRouter);
router.use("/users", usersRouter);
router.use("/me", meRouter);

export default router;
