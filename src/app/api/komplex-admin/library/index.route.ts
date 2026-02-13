import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { getAllBooks as getAdminAllBooks, AdminBooksResponseSchema } from "../library/books/get.js";
import { createBook as createAdminBook, AdminCreateBookBodySchema, AdminCreateBookResponseSchema } from "../library/books/post.js";
import { getBookById as getAdminBookById, AdminBookByIdResponseSchema } from "../library/books/[id]/get.js";
// Note: Update book endpoint not yet implemented
import { deleteBook as deleteAdminBook, AdminDeleteBookParamsSchema, AdminDeleteBookResponseSchema } from "../library/books/[id]/delete.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Admin Library Routes
// ============================================================================
router.get("/books", verifyFirebaseTokenAdmin as any, getAdminAllBooks as any);
router.post("/books", verifyFirebaseTokenAdmin as any, createAdminBook as any);
router.get("/books/:id", verifyFirebaseTokenAdmin as any, getAdminBookById as any);
// router.put("/books/:id", verifyFirebaseTokenAdmin as any, updateAdminBook as any); // Not yet implemented
router.delete("/books/:id", verifyFirebaseTokenAdmin as any, deleteAdminBook as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex-admin/library/books",
    summary: "Get all books",
    tag: "Admin Library",
    responses: {
        200: {
            description: "Books retrieved successfully",
            schema: getResponseSuccessSchema(AdminBooksResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex-admin/library/books",
    summary: "Create a new book",
    tag: "Admin Library",
    body: AdminCreateBookBodySchema,
    responses: {
        201: {
            description: "Book created successfully",
            schema: getResponseSuccessSchema(AdminCreateBookResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex-admin/library/books/:id",
    summary: "Get book by ID",
    tag: "Admin Library",
    responses: {
        200: {
            description: "Book retrieved successfully",
            schema: getResponseSuccessSchema(AdminBookByIdResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

// Note: Update book endpoint schemas not yet implemented

registerOpenApiRoute({
    method: HttpMethod.DELETE,
    path: "/komplex-admin/library/books/:id",
    summary: "Delete a book",
    tag: "Admin Library",
    responses: {
        200: {
            description: "Book deleted successfully",
            schema: getResponseSuccessSchema(AdminDeleteBookResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;
