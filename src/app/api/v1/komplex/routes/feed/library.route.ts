import { Router } from "express";
import { getBookByIdController, getAllBooksController, getBooksByLessonController, getBooksBySubjectController, filterBooksController, } from "../../controllers/feed/library.controller.js";

const router = Router();

router.get("/", getAllBooksController);
router.get("/:id", getBookByIdController);
router.get("/lesson/:lessonId", getBooksByLessonController);
router.get("/subject/:subjectId", getBooksBySubjectController);
router.post("/filter", filterBooksController);

export default router;
