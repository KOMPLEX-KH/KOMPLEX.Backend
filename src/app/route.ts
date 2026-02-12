import Router from "express";
import komplexRouter from "./api/komplex/index.route.js";
import komplexAdminRouter from "./api/komplex-admin/index.route.js";

const BASE_API = "/api/komplex";
const ADMIN_BASE_API = "/api/komplex-admin";
const router = Router();

// ============================================================================
// Main Routes
// ============================================================================
router.use(BASE_API, komplexRouter);
router.use(ADMIN_BASE_API, komplexAdminRouter);

export default router;
