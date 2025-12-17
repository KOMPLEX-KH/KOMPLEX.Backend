import { Router } from "express";
import forumsRouter from "./forums.route.js";
import forumCommentsRouter from "./forum-comments.route.js";
import forumRepliesRouter from "./forum-replies.route.js";
import videosRouter from "./videos.route.js";
import videoHistoryRouter from "./video-history.route.js";
import videoCommentsRouter from "./video-comments.route.js";
import videoRepliesRouter from "./video-replies.route.js";
import exercisesRouter from "./exercises.route.js";
import followRouter from "./follow.route.js";
import feedbackRouter from "./feedback.route.js";
import aiRouter from "./ai.route.js";
import { getUserContentDashboardController } from "../../controllers/me/dashboard.controller.js";
import {
  getCurrentUser,
  getMeProfile,
} from "../../controllers/me/.controller.js";
import { verifyFirebaseToken } from "../../../../middleware/auth.js";
import lastAccessedRouter from "./last-accessed.route.js";

const router = Router();

// My content and interactions
router.get("/", verifyFirebaseToken as any, getCurrentUser as any);
router.get("/profile", verifyFirebaseToken as any, getMeProfile as any);
router.get(
  "/dashboard",
  verifyFirebaseToken as any,
  getUserContentDashboardController as any
); // GET /me/dashboard - my dashboard

router.use("/forums", forumsRouter);
router.use("/forum-comments", forumCommentsRouter);
router.use("/forum-replies", forumRepliesRouter);

router.use("/videos", videosRouter);
router.use("/video-history", videoHistoryRouter);
router.use("/video-comments", videoCommentsRouter);
router.use("/video-replies", videoRepliesRouter);

router.use("/exercises", exercisesRouter);

router.use("/follow", followRouter); // empty for now

router.use("/feedback", feedbackRouter);

router.use("/ai", aiRouter);

router.use("/last-accessed", lastAccessedRouter);

export default router;
