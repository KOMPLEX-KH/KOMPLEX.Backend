export const responseError = (res: any, error: unknown) => {
	return res.status(500).json({
		success: false,
		error: process.env.ENVIRONMENT === "development" ? (error as Error).message : "Internal Server Error",
	});
};