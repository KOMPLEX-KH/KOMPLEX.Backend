import Router from "express";
import videosRouter from "./videos/index.route.js";
import forumsRouter from "./forums/index.route.js";
import newsRouter from "./news/index.route.js";
import exercisesRouter from "./exercises/index.route.js";
import curriculumsRouter from "./curriculums/index.route.js";
import booksRouter from "./books/index.route.js";

const router = Router();

// ============================================================================
// Feed Routes
// ============================================================================
router.use("/videos", videosRouter);
router.use("/forums", forumsRouter);
router.use("/news", newsRouter);
router.use("/exercises", exercisesRouter);
router.use("/curriculums", curriculumsRouter);
router.use("/books", booksRouter);

export default router;
