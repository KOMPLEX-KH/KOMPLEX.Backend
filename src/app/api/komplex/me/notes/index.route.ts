import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import {
    getSmallContentRateLimiter,
    getBigContentRateLimiter,
    postBigRateLimiter,
    deleteSmallRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getMyNotes, MeNotesResponseSchema, NoteItemSchema } from "../../me/notes/get.js";
import { createMyNote } from "../../me/notes/post.js";
import { getMyNoteById } from "../../me/notes/[id]/get.js";
import { updateMyNote } from "../../me/notes/[id]/put.js";
import { deleteMyNote } from "../../me/notes/[id]/delete.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

const router = Router();

// ============================================================================
// Me Notes Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getSmallContentRateLimiter, getMyNotes as any);
router.post("", verifyFirebaseToken as any, getBigContentRateLimiter, createMyNote as any);
router.get("/:id", verifyFirebaseToken as any, getSmallContentRateLimiter, getMyNoteById as any);
router.put("/:id", verifyFirebaseToken as any, postBigRateLimiter, updateMyNote as any);
router.delete("/:id", verifyFirebaseToken as any, deleteSmallRateLimiter, deleteMyNote as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/notes",
    summary: "Get all notes",
    tag: "Me",
    responses: {
        200: {
            description: "Notes retrieved successfully",
            schema: getResponseSuccessSchema(MeNotesResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/notes",
    summary: "Create a note",
    tag: "Me",
    responses: {
        201: {
            description: "Note created successfully",
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
    path: "/komplex/me/notes/:id",
    summary: "Get note by ID",
    tag: "Me",
    responses: {
        200: {
            description: "Note retrieved successfully",
            schema: getResponseSuccessSchema(NoteItemSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PUT,
    path: "/komplex/me/notes/:id",
    summary: "Update a note",
    tag: "Me",
    responses: {
        200: {
            description: "Note updated successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.DELETE,
    path: "/komplex/me/notes/:id",
    summary: "Delete a note",
    tag: "Me",
    responses: {
        200: {
            description: "Note deleted successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;
