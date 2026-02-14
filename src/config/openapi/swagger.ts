import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

export const userApiRegistry = new OpenAPIRegistry();
export const adminApiRegistry = new OpenAPIRegistry();

export const generateUserOpenAPIDocument = () => {
    const generator = new OpenApiGeneratorV3(userApiRegistry.definitions);

    return generator.generateDocument({
        openapi: "3.0.0",
        info: {
            title: "Komplex API",
            version: "1.0.0",
        },
        servers: [{ url: "https://api.komplex.app" }],
    });
};

export const generateAdminOpenAPIDocument = () => {
    const generator = new OpenApiGeneratorV3(userApiRegistry.definitions);

    return generator.generateDocument({
        openapi: "3.0.0",
        info: {
            title: "Komplex Admin API",
            version: "1.0.0",
        },
        servers: [{ url: "https://api.komplex.app" }],
    });
};