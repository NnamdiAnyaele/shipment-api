const Joi = require("joi");
const { SHIPMENT_STATUS } = require("../enums");

/**
 * User validation schemas
 */
const userValidation = {
	register: Joi.object({
		name: Joi.string().min(2).max(100).required().messages({
			"string.empty": "Name is required",
			"string.min": "Name must be at least 2 characters",
			"string.max": "Name cannot exceed 100 characters",
		}),
		email: Joi.string().email().required().messages({
			"string.empty": "Email is required",
			"string.email": "Please provide a valid email",
		}),
		password: Joi.string().min(6).max(128).required().messages({
			"string.empty": "Password is required",
			"string.min": "Password must be at least 6 characters",
			"string.max": "Password cannot exceed 128 characters",
		}),
	}),

	login: Joi.object({
		email: Joi.string().email().required().messages({
			"string.empty": "Email is required",
			"string.email": "Please provide a valid email",
		}),
		password: Joi.string().required().messages({
			"string.empty": "Password is required",
		}),
	}),

	updateProfile: Joi.object({
		name: Joi.string().min(2).max(100).messages({
			"string.min": "Name must be at least 2 characters",
			"string.max": "Name cannot exceed 100 characters",
		}),
		email: Joi.string().email().messages({
			"string.email": "Please provide a valid email",
		}),
	}),

	changePassword: Joi.object({
		currentPassword: Joi.string().required().messages({
			"string.empty": "Current password is required",
		}),
		newPassword: Joi.string().min(6).max(128).required().messages({
			"string.empty": "New password is required",
			"string.min": "New password must be at least 6 characters",
			"string.max": "New password cannot exceed 128 characters",
		}),
	}),
};

/**
 * Shipment validation schemas
 */
const shipmentValidation = {
	create: Joi.object({
		senderName: Joi.string().min(2).max(100).required().messages({
			"string.empty": "Sender name is required",
			"string.min": "Sender name must be at least 2 characters",
			"string.max": "Sender name cannot exceed 100 characters",
		}),
		receiverName: Joi.string().min(2).max(100).required().messages({
			"string.empty": "Receiver name is required",
			"string.min": "Receiver name must be at least 2 characters",
			"string.max": "Receiver name cannot exceed 100 characters",
		}),
		origin: Joi.string().min(2).max(200).required().messages({
			"string.empty": "Origin is required",
			"string.min": "Origin must be at least 2 characters",
			"string.max": "Origin cannot exceed 200 characters",
		}),
		destination: Joi.string().min(2).max(200).required().messages({
			"string.empty": "Destination is required",
			"string.min": "Destination must be at least 2 characters",
			"string.max": "Destination cannot exceed 200 characters",
		}),
		status: Joi.string()
			.valid(...Object.values(SHIPMENT_STATUS))
			.default(SHIPMENT_STATUS.PENDING)
			.messages({
				"any.only": `Status must be one of: ${Object.values(
					SHIPMENT_STATUS
				).join(", ")}`,
			}),
		weight: Joi.number().positive().max(10000).messages({
			"number.positive": "Weight must be a positive number",
			"number.max": "Weight cannot exceed 10000 kg",
		}),
		description: Joi.string().max(1000).messages({
			"string.max": "Description cannot exceed 1000 characters",
		}),
		estimatedDelivery: Joi.date().greater("now").messages({
			"date.greater": "Estimated delivery must be in the future",
		}),
	}),

	update: Joi.object({
		trackingNumber: Joi.any().strip(),
		senderName: Joi.string().min(2).max(100).messages({
			"string.min": "Sender name must be at least 2 characters",
			"string.max": "Sender name cannot exceed 100 characters",
		}),
		receiverName: Joi.string().min(2).max(100).messages({
			"string.min": "Receiver name must be at least 2 characters",
			"string.max": "Receiver name cannot exceed 100 characters",
		}),
		origin: Joi.string().min(2).max(200).messages({
			"string.min": "Origin must be at least 2 characters",
			"string.max": "Origin cannot exceed 200 characters",
		}),
		destination: Joi.string().min(2).max(200).messages({
			"string.min": "Destination must be at least 2 characters",
			"string.max": "Destination cannot exceed 200 characters",
		}),
		status: Joi.string()
			.valid(...Object.values(SHIPMENT_STATUS))
			.messages({
				"any.only": `Status must be one of: ${Object.values(
					SHIPMENT_STATUS
				).join(", ")}`,
			}),
		weight: Joi.number().positive().max(10000).messages({
			"number.positive": "Weight must be a positive number",
			"number.max": "Weight cannot exceed 10000 kg",
		}),
		description: Joi.string().max(1000).messages({
			"string.max": "Description cannot exceed 1000 characters",
		}),
		estimatedDelivery: Joi.date().messages({
			"date.base": "Please provide a valid date",
		}),
	}),

	query: Joi.object({
		page: Joi.number().integer().min(1).default(1),
		limit: Joi.number().integer().min(1).max(100).default(10),
		status: Joi.string().valid(...Object.values(SHIPMENT_STATUS)),
		search: Joi.string().max(100),
		sortBy: Joi.string()
			.valid("createdAt", "updatedAt", "trackingNumber", "status")
			.default("createdAt"),
		sortOrder: Joi.string().valid("asc", "desc").default("desc"),
	}),
};

/**
 * ID parameter validation
 */
const idParamValidation = Joi.object({
	id: Joi.string()
		.pattern(/^[0-9a-fA-F]{24}$/)
		.required()
		.messages({
			"string.pattern.base": "Invalid ID format",
			"string.empty": "ID is required",
		}),
});

/**
 * Validate request data against schema
 */
const validate = (schema, property = "body") => {
	return (req, res, next) => {
		const { error, value } = schema.validate(req[property], {
			abortEarly: false,
			stripUnknown: true,
		});

		if (error) {
			error.isJoi = true;
			return next(error);
		}

		req[property] = value;
		next();
	};
};

module.exports = {
	userValidation,
	shipmentValidation,
	idParamValidation,
	validate,
};
