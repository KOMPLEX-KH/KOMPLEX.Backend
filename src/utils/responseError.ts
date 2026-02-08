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

export const responseError = (res: Response, error: ResponseError) => {
	return res.status(error.code).json({
		success: false,
		error: isProd ? getGenericErrorMessage(error.code.toString()) : error.message,
	});
};

export const getResponseError = (res: Response, err: Error) => {
	if (err instanceof ResponseError) {
		return responseError(res, err);
	}
	return responseError(res, new ResponseError(err.message, 500));
}