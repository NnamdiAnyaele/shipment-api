const BaseService = require("./base.service");
const { Shipment } = require("../models");
const HttpError = require("../utils/httpError");
const { SHIPMENT_STATUS } = require("../utils/enums");

/**
 * Shipment Service class
 * Handles all shipment-related business logic
 */
class ShipmentService extends BaseService {
	constructor() {
		super(Shipment);
	}

	/**
	 * Create a new shipment
	 */
	async createShipment(shipmentData, userId) {
		const data = {
			...shipmentData,
			createdBy: userId,
			statusHistory: [
				{
					status: shipmentData.status || SHIPMENT_STATUS.PENDING,
					changedAt: new Date(),
					changedBy: userId,
				},
			],
		};

		const shipment = await this.create(data);

		return this.model
			.findById(shipment._id)
			.populate("createdBy", "name email");
	}

	/**
	 * Get all shipments with filters
	 */
	async getShipments(options = {}) {
		const {
			page = 1,
			limit = 10,
			status,
			search,
			sortBy = "createdAt",
			sortOrder = "desc",
			userId,
		} = options;

		return this.model.search(null, {
			page: parseInt(page, 10),
			limit: parseInt(limit, 10),
			status,
			search,
			sortBy,
			sortOrder,
			createdBy: userId,
		});
	}

	/**
	 * Get shipment by ID
	 */
	async getShipmentById(id, userId = null, isAdmin = false) {
		const shipment = await this.model
			.findById(id)
			.populate("createdBy", "name email")
			.populate("statusHistory.changedBy", "name email");

		if (!shipment) {
			throw HttpError.notFound("Shipment not found");
		}

		// Check authorization if not admin
		if (!isAdmin && userId && shipment.createdBy._id.toString() !== userId) {
			throw HttpError.forbidden("You do not have access to this shipment");
		}

		return shipment;
	}

	/**
	 * Get shipment by tracking number
	 */
	async getShipmentByTrackingNumber(trackingNumber) {
		const shipment = await this.model
			.findByTrackingNumber(trackingNumber)
			.populate("createdBy", "name email");

		if (!shipment) {
			throw HttpError.notFound("Shipment not found");
		}

		return shipment;
	}

	/**
	 * Update shipment
	 */
	async updateShipment(id, updateData, userId, isAdmin = false) {
		const shipment = await this.model.findById(id);

		if (!shipment) {
			throw HttpError.notFound("Shipment not found");
		}

		// Check authorization if not admin
		if (!isAdmin && shipment.createdBy.toString() !== userId) {
			throw HttpError.forbidden("You do not have access to this shipment");
		}

		// Prevent updating certain fields
		const { trackingNumber, createdBy, statusHistory, ...allowedUpdates } =
			updateData;

		// Add updatedBy
		allowedUpdates.updatedBy = userId;

		// Update the shipment
		Object.assign(shipment, allowedUpdates);
		await shipment.save();

		return this.model
			.findById(id)
			.populate("createdBy", "name email")
			.populate("statusHistory.changedBy", "name email");
	}

	/**
	 * Update shipment status
	 */
	async updateStatus(id, status, userId, notes = "", isAdmin = false) {
		const shipment = await this.model.findById(id);

		if (!shipment) {
			throw HttpError.notFound("Shipment not found");
		}

		// Check authorization if not admin
		if (!isAdmin && shipment.createdBy.toString() !== userId) {
			throw HttpError.forbidden("You do not have access to this shipment");
		}

		// Validate status transition
		this.validateStatusTransition(shipment.status, status);

		// Update status
		shipment.status = status;
		shipment.updatedBy = userId;

		// Add to status history with notes
		shipment.statusHistory.push({
			status,
			changedAt: new Date(),
			changedBy: userId,
			notes,
		});

		await shipment.save();

		return this.model
			.findById(id)
			.populate("createdBy", "name email")
			.populate("statusHistory.changedBy", "name email");
	}

	/**
	 * Validate status transition
	 */
	validateStatusTransition(currentStatus, newStatus) {
		const validTransitions = {
			[SHIPMENT_STATUS.PENDING]: [
				SHIPMENT_STATUS.IN_TRANSIT,
				SHIPMENT_STATUS.CANCELLED,
			],
			[SHIPMENT_STATUS.IN_TRANSIT]: [
				SHIPMENT_STATUS.DELIVERED,
				SHIPMENT_STATUS.CANCELLED,
			],
			[SHIPMENT_STATUS.DELIVERED]: [],
			[SHIPMENT_STATUS.CANCELLED]: [],
		};

		if (currentStatus === newStatus) {
			return; // No change needed
		}

		if (!validTransitions[currentStatus].includes(newStatus)) {
			throw HttpError.badRequest(
				`Cannot transition from ${currentStatus} to ${newStatus}`
			);
		}
	}

	/**
	 * Delete shipment
	 */
	async deleteShipment(id, userId, isAdmin = false) {
		const shipment = await this.model.findById(id);

		if (!shipment) {
			throw HttpError.notFound("Shipment not found");
		}

		// Check authorization if not admin
		if (!isAdmin && shipment.createdBy.toString() !== userId) {
			throw HttpError.forbidden("You do not have access to this shipment");
		}

		// Only allow deletion of pending or cancelled shipments
		if (
			!isAdmin &&
			shipment.status !== SHIPMENT_STATUS.PENDING &&
			shipment.status !== SHIPMENT_STATUS.CANCELLED
		) {
			throw HttpError.badRequest(
				"Can only delete pending or cancelled shipments"
			);
		}

		await this.model.findByIdAndDelete(id);

		return { message: "Shipment deleted successfully" };
	}

	/**
	 * Add attachment to shipment
	 */
	async addAttachment(id, attachment, userId, isAdmin = false) {
		const shipment = await this.model.findById(id);

		if (!shipment) {
			throw HttpError.notFound("Shipment not found");
		}

		// Check authorization if not admin
		if (!isAdmin && shipment.createdBy.toString() !== userId) {
			throw HttpError.forbidden("You do not have access to this shipment");
		}

		shipment.attachments.push(attachment);
		shipment.updatedBy = userId;
		await shipment.save();

		return shipment;
	}

	/**
	 * Remove attachment from shipment
	 */
	async removeAttachment(id, attachmentId, userId, isAdmin = false) {
		const shipment = await this.model.findById(id);

		if (!shipment) {
			throw HttpError.notFound("Shipment not found");
		}

		// Check authorization if not admin
		if (!isAdmin && shipment.createdBy.toString() !== userId) {
			throw HttpError.forbidden("You do not have access to this shipment");
		}

		const attachmentIndex = shipment.attachments.findIndex(
			(att) => att._id.toString() === attachmentId
		);

		if (attachmentIndex === -1) {
			throw HttpError.notFound("Attachment not found");
		}

		shipment.attachments.splice(attachmentIndex, 1);
		shipment.updatedBy = userId;
		await shipment.save();

		return shipment;
	}

	/**
	 * Get shipment statistics
	 */
	async getStatistics(userId = null) {
		const matchStage = userId ? { createdBy: userId } : {};

		const stats = await this.model.aggregate([
			{ $match: matchStage },
			{
				$group: {
					_id: "$status",
					count: { $sum: 1 },
				},
			},
		]);

		const result = {
			total: 0,
			pending: 0,
			in_transit: 0,
			delivered: 0,
			cancelled: 0,
		};

		stats.forEach((stat) => {
			result[stat._id] = stat.count;
			result.total += stat.count;
		});

		return result;
	}

	/**
	 * Track shipment (public endpoint)
	 */
	async trackShipment(trackingNumber) {
		const shipment = await this.model
			.findByTrackingNumber(trackingNumber)
			.select(
				"trackingNumber senderName receiverName origin destination status statusHistory estimatedDelivery actualDelivery createdAt"
			);

		if (!shipment) {
			throw HttpError.notFound("Shipment not found");
		}

		return shipment;
	}
}

module.exports = new ShipmentService();
