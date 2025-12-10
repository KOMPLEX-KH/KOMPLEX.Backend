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

router.post("/books", createBookController);
router.put("/books/:id", updateBookController);
router.delete("/books/:id", deleteBookController);
router.get("/books", adminGetAllBooksController);
router.get("/books/:id", adminGetBookByIdController);

export default router;
