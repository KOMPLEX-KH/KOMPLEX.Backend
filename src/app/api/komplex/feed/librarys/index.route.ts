import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getAllBooks as getFeedBooks } from "../../feed/librarys/get.js";
import { getBookById as getFeedBookById } from "../../feed/librarys/[id]/get.js";
import { getBooksByLesson } from "../../feed/librarys/lesson/[lessonId]/get.js";
import { getBooksBySubject } from "../../feed/librarys/subject/[subjectId]/get.js";
import { filterBooks } from "../../feed/librarys/filter/post.js";

const router = Router();

// ============================================================================
// Feed Library Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getFeedBooks as any);
router.get("/lesson/:lessonId", verifyFirebaseTokenOptional as any, getBooksByLesson as any);
router.get("/subject/:subjectId", verifyFirebaseTokenOptional as any, getBooksBySubject as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getFeedBookById as any);
router.post("/filter", verifyFirebaseTokenOptional as any, filterBooks as any);

export default router;
