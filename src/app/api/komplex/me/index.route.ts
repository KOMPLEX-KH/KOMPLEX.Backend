import Router from "express";
import profileRouter from "./profile/index.route.js";
import dashboardRouter from "./dashboard/index.route.js";
import lastAccessedRouter from "./last-accessed/index.route.js";
import videoHistoryRouter from "./video-history/index.route.js";
import feedbackRouter from "./feedback/index.route.js";
import followRouter from "./follow/index.route.js";
import videosRouter from "./videos/index.route.js";
import forumsRouter from "./forums/index.route.js";
import notesRouter from "./notes/index.route.js";
import aiRouter from "./ai/index.route.js";

const router = Router();

// ============================================================================
// Me Routes
// ============================================================================
router.use("", profileRouter);
router.use("/dashboard", dashboardRouter);
router.use("/last-accessed", lastAccessedRouter);
router.use("/video-history", videoHistoryRouter);
router.use("/feedback", feedbackRouter);
router.use("/follow", followRouter);
router.use("/videos", videosRouter);
router.use("/forums", forumsRouter);
router.use("/notes", notesRouter);
router.use("/ai", aiRouter);

export default router;
