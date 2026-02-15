import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import {
    getAllBooks as getFeedBooks,
    FeedBooksResponseSchema,
} from "../../feed/librarys/get.js";
import { getBookById as getFeedBookById } from "../../feed/librarys/[id]/get.js";
import {
    getBooksByLesson,
    FeedBooksByLessonResponseSchema,
} from "../../feed/librarys/lesson/[lessonId]/get.js";
import {
    getBooksBySubject,
    FeedBooksBySubjectResponseSchema,
} from "../../feed/librarys/subject/[subjectId]/get.js";
import {
    filterBooks,
    FilterBooksBodySchema,
    FilterBooksResponseSchema,
} from "../../feed/librarys/filter/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const router = Router();

// ============================================================================
// Feed Library Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getFeedBooks as any);
router.get(
    "/lesson/:lessonId",
    verifyFirebaseTokenOptional as any,
    getBooksByLesson as any
);
router.get(
    "/subject/:subjectId",
    verifyFirebaseTokenOptional as any,
    getBooksBySubject as any
);
router.get("/:id", verifyFirebaseTokenOptional as any, getFeedBookById as any);
router.post("/filter", verifyFirebaseTokenOptional as any, filterBooks as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/librarys/:id",
    summary: "Get book by ID",
    tag: "Feed",
    responses: {
        200: {
            description: "Book retrieved successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/librarys",
    summary: "Get all books",
    tag: "Feed",
    responses: {
        200: {
            description: "Books retrieved successfully",
            schema: getResponseSuccessSchema(FeedBooksResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/librarys/lesson/{lessonId}",
    summary: "Get books by lesson",
    tag: "Feed",
    responses: {
        200: {
            description: "Books retrieved successfully",
            schema: getResponseSuccessSchema(FeedBooksByLessonResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/librarys/subject/{subjectId}",
    summary: "Get books by subject",
    tag: "Feed",
    responses: {
        200: {
            description: "Books retrieved successfully",
            schema: getResponseSuccessSchema(FeedBooksBySubjectResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/feed/librarys/filter",
    summary: "Filter books",
    tag: "Feed",
    body: FilterBooksBodySchema,
    responses: {
        200: {
            description: "Filtered books retrieved successfully",
            schema: getResponseSuccessSchema(FilterBooksResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;
