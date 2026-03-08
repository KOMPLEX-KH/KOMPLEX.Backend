import { z } from "@/config/openapi/openapi.js";

export const MediaSchema = z.object({
    url: z.string(),
    type: z.string(),
}).openapi("MediaSchema");