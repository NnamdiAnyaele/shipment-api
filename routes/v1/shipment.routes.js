const BaseRouter = require('../base.router');
const { shipmentController } = require('../../controllers');
const { authenticate, optionalAuth } = require('../../middlewares/auth.middleware');
const { uploadShipmentAttachments, uploadSingle } = require('../../middlewares/upload.middleware');
const { validate, shipmentValidation, idParamValidation } = require('../../utils/validations');
const Joi = require('joi');
const { SHIPMENT_STATUS } = require('../../utils/enums');

/**
 * @swagger
 * components:
 *   schemas:
 *     Shipment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The shipment's unique identifier
 *         trackingNumber:
 *           type: string
 *           description: Unique tracking number for the shipment
 *         senderName:
 *           type: string
 *           description: Name of the sender
 *         receiverName:
 *           type: string
 *           description: Name of the receiver
 *         origin:
 *           type: string
 *           description: Origin address/location
 *         destination:
 *           type: string
 *           description: Destination address/location
 *         status:
 *           type: string
 *           enum: [pending, in_transit, delivered, cancelled]
 *           description: Current status of the shipment
 *         weight:
 *           type: number
 *           description: Weight in kg
 *         description:
 *           type: string
 *           description: Description of the shipment contents
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *           description: Estimated delivery date
 *         actualDelivery:
 *           type: string
 *           format: date-time
 *           description: Actual delivery date
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               originalName:
 *                 type: string
 *               path:
 *                 type: string
 *               mimetype:
 *                 type: string
 *               size:
 *                 type: number
 *         statusHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               changedAt:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *         createdBy:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         daysInTransit:
 *           type: number
 *         isOverdue:
 *           type: boolean
 *     CreateShipmentRequest:
 *       type: object
 *       required:
 *         - senderName
 *         - receiverName
 *         - origin
 *         - destination
 *       properties:
 *         senderName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: John Doe
 *         receiverName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Jane Smith
 *         origin:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           example: Lagos, Nigeria
 *         destination:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           example: Abuja, Nigeria
 *         status:
 *           type: string
 *           enum: [pending, in_transit, delivered, cancelled]
 *           default: pending
 *         weight:
 *           type: number
 *           example: 5.5
 *         description:
 *           type: string
 *           maxLength: 1000
 *           example: Electronics package
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *     UpdateShipmentRequest:
 *       type: object
 *       properties:
 *         senderName:
 *           type: string
 *         receiverName:
 *           type: string
 *         origin:
 *           type: string
 *         destination:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, in_transit, delivered, cancelled]
 *         weight:
 *           type: number
 *         description:
 *           type: string
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *     UpdateStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, in_transit, delivered, cancelled]
 *         notes:
 *           type: string
 *           description: Optional notes about the status change
 *     ShipmentStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         pending:
 *           type: integer
 *         in_transit:
 *           type: integer
 *         delivered:
 *           type: integer
 *         cancelled:
 *           type: integer
 *     ShipmentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Shipment'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalItems:
 *               type: integer
 *             itemsPerPage:
 *               type: integer
 */

// Additional validation schemas
const updateStatusValidation = Joi.object({
  status: Joi.string()
    .valid(...Object.values(SHIPMENT_STATUS))
    .required()
    .messages({
      'any.only': `Status must be one of: ${Object.values(SHIPMENT_STATUS).join(', ')}`,
    }),
  notes: Joi.string().max(500).allow(''),
});

const trackingNumberValidation = Joi.object({
  trackingNumber: Joi.string()
    .required()
    .messages({
      'string.empty': 'Tracking number is required',
    }),
});

const attachmentIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  attachmentId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

/**
 * Shipment Router class
 * Handles shipment routes
 */
class ShipmentRouter extends BaseRouter {
  constructor() {
    super();
  }

  initializeRoutes() {
    /**
     * @swagger
     * /api/shipments/stats:
     *   get:
     *     summary: Get shipment statistics
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: userId
     *         schema:
     *           type: string
     *         description: User ID to get stats for (admin only)
     *     responses:
     *       200:
     *         description: Statistics retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/ShipmentStats'
     *       401:
     *         description: Unauthorized
     */
    this.get(
      '/stats',
      authenticate,
      shipmentController.getStatistics
    );

    /**
     * @swagger
     * /api/shipments/my-stats:
     *   get:
     *     summary: Get current user's shipment statistics
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Statistics retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/ShipmentStats'
     */
    this.get(
      '/my-stats',
      authenticate,
      shipmentController.getMyStatistics
    );

    /**
     * @swagger
     * /api/shipments/track/{trackingNumber}:
     *   get:
     *     summary: Get shipment by tracking number
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: trackingNumber
     *         required: true
     *         schema:
     *           type: string
     *         description: Shipment tracking number
     *     responses:
     *       200:
     *         description: Shipment retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Shipment'
     *       404:
     *         description: Shipment not found
     */
    this.get(
      '/track/:trackingNumber',
      authenticate,
      validate(trackingNumberValidation, 'params'),
      shipmentController.getByTrackingNumber
    );

    /**
     * @swagger
     * /api/shipments:
     *   get:
     *     summary: Get all shipments
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Items per page
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [pending, in_transit, delivered, cancelled]
     *         description: Filter by status
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search in tracking number, sender, receiver, origin, destination
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [createdAt, updatedAt, trackingNumber, status]
     *           default: createdAt
     *         description: Sort field
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: desc
     *         description: Sort order
     *     responses:
     *       200:
     *         description: Shipments retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ShipmentListResponse'
     *       401:
     *         description: Unauthorized
     */
    this.get(
      '/',
      authenticate,
      validate(shipmentValidation.query, 'query'),
      shipmentController.getAll
    );

    /**
     * @swagger
     * /api/shipments/{id}:
     *   get:
     *     summary: Get a single shipment by ID
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Shipment ID
     *     responses:
     *       200:
     *         description: Shipment retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Shipment'
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Shipment not found
     */
    this.get(
      '/:id',
      authenticate,
      validate(idParamValidation, 'params'),
      shipmentController.getById
    );

    /**
     * @swagger
     * /api/shipments:
     *   post:
     *     summary: Create a new shipment
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateShipmentRequest'
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - senderName
     *               - receiverName
     *               - origin
     *               - destination
     *             properties:
     *               senderName:
     *                 type: string
     *               receiverName:
     *                 type: string
     *               origin:
     *                 type: string
     *               destination:
     *                 type: string
     *               status:
     *                 type: string
     *               weight:
     *                 type: number
     *               description:
     *                 type: string
     *               estimatedDelivery:
     *                 type: string
     *                 format: date-time
     *               attachments:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: binary
     *     responses:
     *       201:
     *         description: Shipment created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Shipment'
     *       401:
     *         description: Unauthorized
     *       422:
     *         description: Validation error
     */
    this.post(
      '/',
      authenticate,
      uploadShipmentAttachments,
      validate(shipmentValidation.create),
      shipmentController.create
    );

    /**
     * @swagger
     * /api/shipments/{id}:
     *   put:
     *     summary: Update a shipment
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Shipment ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateShipmentRequest'
     *     responses:
     *       200:
     *         description: Shipment updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Shipment'
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Shipment not found
     */
    this.put(
      '/:id',
      authenticate,
      validate(idParamValidation, 'params'),
      validate(shipmentValidation.update),
      shipmentController.update
    );

    /**
     * @swagger
     * /api/shipments/{id}/status:
     *   patch:
     *     summary: Update shipment status
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Shipment ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateStatusRequest'
     *     responses:
     *       200:
     *         description: Status updated successfully
     *       400:
     *         description: Invalid status transition
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Shipment not found
     */
    this.patch(
      '/:id/status',
      authenticate,
      validate(idParamValidation, 'params'),
      validate(updateStatusValidation),
      shipmentController.updateStatus
    );

    /**
     * @swagger
     * /api/shipments/{id}:
     *   delete:
     *     summary: Delete a shipment
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Shipment ID
     *     responses:
     *       200:
     *         description: Shipment deleted successfully
     *       400:
     *         description: Cannot delete shipment (wrong status)
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Shipment not found
     */
    this.delete(
      '/:id',
      authenticate,
      validate(idParamValidation, 'params'),
      shipmentController.delete
    );

    /**
     * @swagger
     * /api/shipments/{id}/attachments:
     *   post:
     *     summary: Add attachment to shipment
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Shipment ID
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Attachment added successfully
     *       400:
     *         description: No file uploaded
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Shipment not found
     */
    this.post(
      '/:id/attachments',
      authenticate,
      validate(idParamValidation, 'params'),
      uploadSingle('file'),
      shipmentController.addAttachment
    );

    /**
     * @swagger
     * /api/shipments/{id}/attachments/{attachmentId}:
     *   delete:
     *     summary: Remove attachment from shipment
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Shipment ID
     *       - in: path
     *         name: attachmentId
     *         required: true
     *         schema:
     *           type: string
     *         description: Attachment ID
     *     responses:
     *       200:
     *         description: Attachment removed successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Shipment or attachment not found
     */
    this.delete(
      '/:id/attachments/:attachmentId',
      authenticate,
      validate(attachmentIdValidation, 'params'),
      shipmentController.removeAttachment
    );
  }
}

module.exports = new ShipmentRouter().getRouter();
