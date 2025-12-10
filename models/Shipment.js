const mongoose = require("mongoose");
const { SHIPMENT_STATUS } = require("../utils/enums");

/**
 * Generate unique tracking number
 */
const generateTrackingNumber = () => {
	const prefix = "SHP";
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).substring(2, 8).toUpperCase();
	return `${prefix}-${timestamp}-${random}`;
};

const shipmentSchema = new mongoose.Schema(
	{
		trackingNumber: {
			type: String,
			unique: true,
			uppercase: true,
			default: generateTrackingNumber,
		},
		senderName: {
			type: String,
			required: [true, "Sender name is required"],
			trim: true,
			minlength: [2, "Sender name must be at least 2 characters"],
			maxlength: [100, "Sender name cannot exceed 100 characters"],
		},
		receiverName: {
			type: String,
			required: [true, "Receiver name is required"],
			trim: true,
			minlength: [2, "Receiver name must be at least 2 characters"],
			maxlength: [100, "Receiver name cannot exceed 100 characters"],
		},
		origin: {
			type: String,
			required: [true, "Origin is required"],
			trim: true,
			minlength: [2, "Origin must be at least 2 characters"],
			maxlength: [200, "Origin cannot exceed 200 characters"],
		},
		destination: {
			type: String,
			required: [true, "Destination is required"],
			trim: true,
			minlength: [2, "Destination must be at least 2 characters"],
			maxlength: [200, "Destination cannot exceed 200 characters"],
		},
		status: {
			type: String,
			enum: {
				values: Object.values(SHIPMENT_STATUS),
				message: `Status must be one of: ${Object.values(SHIPMENT_STATUS).join(
					", "
				)}`,
			},
			default: SHIPMENT_STATUS.PENDING,
			index: true,
		},
		weight: {
			type: Number,
			min: [0, "Weight cannot be negative"],
			max: [10000, "Weight cannot exceed 10000 kg"],
		},
		description: {
			type: String,
			trim: true,
			maxlength: [1000, "Description cannot exceed 1000 characters"],
		},
		estimatedDelivery: {
			type: Date,
		},
		actualDelivery: {
			type: Date,
		},
		attachments: [
			{
				filename: String,
				originalName: String,
				path: String,
				mimetype: String,
				size: Number,
				uploadedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		statusHistory: [
			{
				status: {
					type: String,
					enum: Object.values(SHIPMENT_STATUS),
				},
				changedAt: {
					type: Date,
					default: Date.now,
				},
				changedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				notes: String,
			},
		],
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: function (doc, ret) {
				delete ret.__v;
				return ret;
			},
		},
		toObject: {
			virtuals: true,
		},
	}
);

// Compound indexes for common queries
shipmentSchema.index({ createdBy: 1, status: 1 });
shipmentSchema.index({ createdAt: -1 });
shipmentSchema.index({
	senderName: "text",
	receiverName: "text",
	origin: "text",
	destination: "text",
});

/**
 * Generate tracking number if not provided
 */
shipmentSchema.pre("save", function (next) {
	if (!this.trackingNumber) {
		this.trackingNumber = generateTrackingNumber();
	}
	next();
});

/**
 * Add status to history when status changes
 */
shipmentSchema.pre("save", function (next) {
	if (this.isModified("status")) {
		this.statusHistory.push({
			status: this.status,
			changedAt: new Date(),
			changedBy: this.updatedBy || this.createdBy,
		});

		// Set actual delivery date when status is delivered
		if (this.status === SHIPMENT_STATUS.DELIVERED && !this.actualDelivery) {
			this.actualDelivery = new Date();
		}
	}
	next();
});

/**
 * Virtual for days in transit
 */
shipmentSchema.virtual("daysInTransit").get(function () {
	if (this.status === SHIPMENT_STATUS.PENDING) {
		return 0;
	}

	const endDate = this.actualDelivery || new Date();
	const startDate = this.createdAt;
	const diffTime = Math.abs(endDate - startDate);
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays;
});

/**
 * Virtual for is overdue
 */
shipmentSchema.virtual("isOverdue").get(function () {
	if (
		this.status === SHIPMENT_STATUS.DELIVERED ||
		this.status === SHIPMENT_STATUS.CANCELLED ||
		!this.estimatedDelivery
	) {
		return false;
	}
	return new Date() > this.estimatedDelivery;
});

/**
 * Static method to find by tracking number
 */
shipmentSchema.statics.findByTrackingNumber = function (trackingNumber) {
	return this.findOne({ trackingNumber: trackingNumber.toUpperCase() });
};

/**
 * Static method to search shipments
 */
shipmentSchema.statics.search = async function (query, options = {}) {
	const {
		page = 1,
		limit = 10,
		status,
		search,
		sortBy = "createdAt",
		sortOrder = "desc",
		createdBy,
	} = options;

	const filter = {};

	if (status) {
		filter.status = status;
	}

	if (createdBy) {
		filter.createdBy = createdBy;
	}

	if (search) {
		filter.$or = [
			{ trackingNumber: { $regex: search, $options: "i" } },
			{ senderName: { $regex: search, $options: "i" } },
			{ receiverName: { $regex: search, $options: "i" } },
			{ origin: { $regex: search, $options: "i" } },
			{ destination: { $regex: search, $options: "i" } },
		];
	}

	const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

	const skip = (page - 1) * limit;

	const [shipments, total] = await Promise.all([
		this.find(filter)
			.populate("createdBy", "name email")
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean(),
		this.countDocuments(filter),
	]);

	return {
		shipments,
		pagination: {
			page,
			limit,
			total,
		},
	};
};

const Shipment = mongoose.model("Shipment", shipmentSchema);

module.exports = Shipment;
