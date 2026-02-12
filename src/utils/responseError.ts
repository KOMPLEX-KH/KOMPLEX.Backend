import { Response } from "express";
import { z } from "@/config/openapi/openapi.js";

export type ResponseErrorWrapper = {
	success: boolean;
	error?: string;
	data?: any;
}

export type ResponseSuccessWrapper = {
	success: true;
	data: any;
}

const getGenericErrorMessage = (code: string) => {
	const errorMessages = {
		"400": "Bad Request",
		"401": "Unauthorized",
		"403": "Forbidden",
		"404": "Not Found",
		"405": "Method Not Allowed",
		"409": "Conflict",
		"422": "Unprocessable Entity",
		"429": "Too Many Requests",
		"500": "Internal Server Error",
		"502": "Bad Gateway",
		"503": "Service Unavailable",
		"504": "Gateway Timeout",
		"default": "Unknown Error"
	}
	return errorMessages[code as keyof typeof errorMessages] || errorMessages["default"];
}

export class ResponseError extends Error {
	code: number;

	constructor(message: string, code: number) {
		super(message);
		this.code = code;

		// Fix prototype chain (important)
		Object.setPrototypeOf(this, ResponseError.prototype);
	}
}

const isProd = process.env.NODE_ENV === "production";

export const getResponseError = (res: Response, err: unknown) => {
	if (err instanceof ResponseError) {
		const response: ResponseErrorWrapper = {
			success: false,
			error: isProd ? getGenericErrorMessage(err.code.toString()) : err.message,
		}
		return res.status(err.code).json(response);
	}
	if (err instanceof z.ZodError) {
		const response: ResponseErrorWrapper = {
			success: false,
			error: isProd ? getGenericErrorMessage("400") : err.issues.map((issue) => issue.message).join(", "),
		}
		return res.status(400).json(response);
	}

	const response: ResponseErrorWrapper = {
		success: false,
		error: isProd ? getGenericErrorMessage("500") : (err instanceof Error ? err.message : "Internal Server Error"),
	}
	return res.status(500).json(response);
}

export const getResponseSuccess = (res: Response, data: any) => {
	const response: ResponseSuccessWrapper = {
		success: true,
		data,
	}
	return res.status(200).json(response);
}

export const getResponseSuccessSchema = (
	dataSchema: z.ZodTypeAny
) => {
	return z.object({
		success: z.literal(true),
		data: dataSchema,
	});
};

export const getResponseErrorSchema = (
	errorSchema?: z.ZodTypeAny
) => {
	return z.object({
		success: z.literal(false),
		error: errorSchema ? errorSchema : z.string(),
	});
};