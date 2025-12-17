import { Router } from "express";
import videoRoute from "./videos.route.js";
import forumRoute from "./forums.route.js";

const router = Router();

router.use("/videos", videoRoute);
router.use("/forums", forumRoute);

export default router;
