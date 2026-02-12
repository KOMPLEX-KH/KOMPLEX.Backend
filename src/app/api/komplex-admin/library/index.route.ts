import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { getAllBooks as getAdminAllBooks } from "../library/books/get.js";
import { createBook as createAdminBook } from "../library/books/post.js";
import { getBookById as getAdminBookById } from "../library/books/[id]/get.js";
import { updateBook as updateAdminBook } from "../library/books/[id]/put.js";
import { deleteBook as deleteAdminBook } from "../library/books/[id]/delete.js";

const router = Router();

// ============================================================================
// Admin Library Routes
// ============================================================================
router.get("/books", verifyFirebaseTokenAdmin as any, getAdminAllBooks as any);
router.post("/books", verifyFirebaseTokenAdmin as any, createAdminBook as any);
router.get("/books/:id", verifyFirebaseTokenAdmin as any, getAdminBookById as any);
router.put("/books/:id", verifyFirebaseTokenAdmin as any, updateAdminBook as any);
router.delete("/books/:id", verifyFirebaseTokenAdmin as any, deleteAdminBook as any);

export default router;
