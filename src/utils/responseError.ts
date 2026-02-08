import { Response } from "express";

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
		return res.status(err.code).json({
			success: false,
			error: isProd ? getGenericErrorMessage(err.code.toString()) : err.message,
		});
	}
	return res.status(500).json({
		success: false,
		error: isProd ? getGenericErrorMessage("500") : (err instanceof Error ? err.message : "Internal Server Error"),
	});
}