import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import {
    getAllBooks as getFeedBooks,
    BookItemSchema,
} from "./get.js";
import { getBookById as getFeedBookById } from "./[id]/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Feed Library Routes
// ============================================================================
router.get("/", verifyFirebaseTokenOptional as any, getFeedBooks as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getFeedBookById as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/books/:id",
    summary: "Get book by ID",
    tag: "Feed",
    responses: {
        200: {
            description: "Book retrieved successfully",
            schema: getResponseSuccessSchema(BookItemSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "komplex/feed/books",
    summary: "Get all books",
    tag: "Feed",
    responses: {
        200: {
            description: "Books retrieved successfully",
            schema: getResponseSuccessSchema(BookItemSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});


export default router;
