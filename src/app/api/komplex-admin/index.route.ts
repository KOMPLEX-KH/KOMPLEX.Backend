import Router from "express";
import authRouter from "./auth/index.route.js";
import dashboardRouter from "./dashboard/index.route.js";
import videosRouter from "./videos/index.route.js";
import gradesRouter from "./grades/index.route.js";
import subjectsRouter from "./subjects/index.route.js";
import usersRouter from "./users/index.route.js";
import forumsRouter from "./forums/index.route.js";
import newsRouter from "./news/index.route.js";
import exercisesRouter from "./exercises/index.route.js";
import feedbacksRouter from "./feedbacks/index.route.js";
import forumCommentsRouter from "./forum_comments/index.route.js";
import forumRepliesRouter from "./forum_replies/index.route.js";
import aiRouter from "./ai/index.route.js";
import curriculumsRouter from "./curriculums/index.route.js";
import databaseRouter from "./database/index.route.js";
import libraryRouter from "./library/index.route.js";
import uploadRouter from "./upload/index.route.js";

const router = Router();

// ============================================================================
// Komplex Admin Routes
// ============================================================================
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/videos", videosRouter);
router.use("/grades", gradesRouter);
router.use("/subjects", subjectsRouter);
router.use("/users", usersRouter);
router.use("/forums", forumsRouter);
router.use("/news", newsRouter);
router.use("/exercises", exercisesRouter);
router.use("/feedbacks", feedbacksRouter);
router.use("/forum_comments", forumCommentsRouter);
router.use("/forum_replies", forumRepliesRouter);
router.use("/ai", aiRouter);
router.use("/curriculums", curriculumsRouter);
router.use("/database", databaseRouter);
router.use("/library", libraryRouter);
router.use("/upload", uploadRouter);

export default router;
