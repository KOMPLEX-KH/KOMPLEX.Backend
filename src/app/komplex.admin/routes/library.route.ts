import { Router } from "express";
import { createBookController, updateBookController, deleteBookController, adminGetAllBooksController, adminGetBookByIdController } from "../controllers/library.controller.js";
import { 
    getSmallContentRateLimiter,
    searchRateLimiter,
    adminSmallPostRateLimiter,
    adminSmallUpdateRateLimiter,
    adminSmallDeleteRateLimiter,
    adminGetSmallContentRateLimiter
 } from "@/middleware/redisLimiter.js";

const router = Router();

router.post("/books", adminSmallPostRateLimiter, createBookController);
router.put("/books/:id", adminSmallUpdateRateLimiter, updateBookController);
router.delete("/books/:id", adminSmallDeleteRateLimiter, deleteBookController);
router.get("/books", adminGetSmallContentRateLimiter, adminGetAllBooksController);
router.get("/books/:id", adminGetSmallContentRateLimiter, adminGetBookByIdController);

export default router;
