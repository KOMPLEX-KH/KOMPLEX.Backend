import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { AdminUploadFileResponseSchema, uploadFile as uploadAdminFile } from "../upload/file/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Admin Upload Routes
// ============================================================================
router.post("/file", verifyFirebaseTokenAdmin as any, uploadAdminFile as any);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.POST,
    path: "/komplex-admin/upload/file",
    summary: "Upload a file",
    tag: "Admin Upload",
    responses: {
        200: {
            description: "File uploaded successfully",
            schema: getResponseSuccessSchema(AdminUploadFileResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;
