import { registry } from "@/config/openapi/swagger.js";
import { z } from "@/config/openapi/openapi.js";

export enum HttpMethod {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    PATCH = "patch",
    OPTIONS = "options",
    HEAD = "head",
}

type ResponseConfig = {
    schema: z.ZodTypeAny;
    description: string;
};

type RegisterRouteConfig = {
    method: HttpMethod;
    path: string;
    summary: string;
    tag?: string;

    body?: z.ZodTypeAny;

    params?: z.ZodTypeAny;
    query?: z.ZodTypeAny;

    responses: Record<number, ResponseConfig>;
};

export const registerOpenApiRoute = ({
    method,
    path,
    summary,
    tag,
    body,
    params,
    query,
    responses,
}: RegisterRouteConfig) => {
    registry.registerPath({
        method,
        path,
        summary,
        tags: tag ? [tag] : undefined,

        request: {
            params:  undefined,
            query:  undefined,
            body: body
                ? {
                    content: { "application/json": { schema: body } },  
                }
                : undefined,
        },

        responses: Object.fromEntries(
            Object.entries(responses).map(([status, config]) => [
                status,
                {
                    description: config.description,
                    content: { "application/json": { schema: config.schema } },
                },
            ])
        ),
    });
};
