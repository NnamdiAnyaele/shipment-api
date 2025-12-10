const multer = require("multer");
const ApiResponse = require("./apiResponse");
const { logError } = require("./logger");
const config = require("../config");

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
	logError("ErrorHandler", err);

	// Handle Multer file upload errors
	if (err instanceof multer.MulterError) {
		let message = "File upload error";

		switch (err.code) {
			case "LIMIT_FILE_SIZE":
				message = `File size exceeds ${
					config.MAX_FILE_SIZE / (1024 * 1024)
				}MB limit`;
				break;
			case "LIMIT_FILE_COUNT":
				message = "Too many files uploaded";
				break;
			case "LIMIT_UNEXPECTED_FILE":
				message = "Unexpected field in file upload";
				break;
			default:
				message = err.message || "File upload error occurred";
		}

		return ApiResponse.error(res, message, 400);
	}

	// Handle file filter errors (invalid file types)
	if (err.message && err.message.includes("Invalid file type")) {
		return ApiResponse.error(res, err.message, 400);
	}

	// Handle Joi validation errors
	if (err.isJoi) {
		const errors = err.details.map((detail) => ({
			field: detail.path.join("."),
			message: detail.message,
		}));
		return ApiResponse.error(res, "Validation failed", 422, errors);
	}

	// Handle Mongoose validation errors
	if (err.name === "ValidationError") {
		const errors = Object.values(err.errors).map((e) => ({
			field: e.path,
			message: e.message,
		}));
		return ApiResponse.error(res, "Validation failed", 422, errors);
	}

	// Handle Mongoose duplicate key errors
	if (err.code === 11000) {
		const field = Object.keys(err.keyValue)[0];
		return ApiResponse.error(res, `${field} already exists`, 409);
	}

	// Handle Mongoose CastError (invalid ObjectId)
	if (err.name === "CastError") {
		return ApiResponse.error(res, `Invalid ${err.path}: ${err.value}`, 422);
	}

	// Handle JWT errors
	if (err.name === "JsonWebTokenError") {
		return ApiResponse.error(res, "Invalid token", 401);
	}

	if (err.name === "TokenExpiredError") {
		return ApiResponse.error(res, "Token expired", 401);
	}

	// Handle operational errors (HttpError)
	if (err.isOperational) {
		return ApiResponse.error(res, err.message, err.statusCode, err.errors);
	}

	// Handle unknown errors
	const statusCode = err.statusCode || 500;
	const message =
		config.NODE_ENV === "development" ? err.message : "Something went wrong";

	return ApiResponse.error(res, message, statusCode);
};

/**
 * Async handler wrapper to catch async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
	errorHandler,
	asyncHandler,
};
