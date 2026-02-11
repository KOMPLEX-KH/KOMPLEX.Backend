import { Router } from "express";
import { getUserForumsController } from "@/app/api/v2/komplex/controllers/users/forums.controller.js";
import { getUserVideosController } from "@/app/api/v2/komplex/controllers/users/videos.controller.js";
import { getUserProfileController } from "@/app/api/v2/komplex/controllers/users/profile.controller.js";

const router = Router();

// ! Using controller functions at index here because for some reason sub router does not work

// Other users' content (read-only)
router.get("/:id/forums", getUserForumsController as any);
router.get("/:id/videos", getUserVideosController as any);
router.get("/:id/profile", getUserProfileController as any);

export default router;
