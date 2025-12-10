const BaseRouter = require('../base.router');
const { shipmentController } = require('../../controllers');
const Joi = require('joi');
const { validate } = require('../../utils/validations');

/**
 * @swagger
 * components:
 *   schemas:
 *     TrackingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             trackingNumber:
 *               type: string
 *             senderName:
 *               type: string
 *             receiverName:
 *               type: string
 *             origin:
 *               type: string
 *             destination:
 *               type: string
 *             status:
 *               type: string
 *               enum: [pending, in_transit, delivered, cancelled]
 *             statusHistory:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                   changedAt:
 *                     type: string
 *                     format: date-time
 *                   notes:
 *                     type: string
 *             estimatedDelivery:
 *               type: string
 *               format: date-time
 *             actualDelivery:
 *               type: string
 *               format: date-time
 *             createdAt:
 *               type: string
 *               format: date-time
 */

// Validation schema for tracking number
const trackingNumberValidation = Joi.object({
  trackingNumber: Joi.string()
    .required()
    .messages({
      'string.empty': 'Tracking number is required',
    }),
});

/**
 * Track Router class
 * Public tracking routes (no authentication required)
 */
class TrackRouter extends BaseRouter {
  constructor() {
    super();
  }

  initializeRoutes() {
    /**
     * @swagger
     * /api/track/{trackingNumber}:
     *   get:
     *     summary: Track a shipment by tracking number (Public)
     *     description: Public endpoint to track a shipment without authentication
     *     tags: [Tracking]
     *     parameters:
     *       - in: path
     *         name: trackingNumber
     *         required: true
     *         schema:
     *           type: string
     *         description: Shipment tracking number
     *         example: SHP-M5X3K9Y-ABC123
     *     responses:
     *       200:
     *         description: Shipment tracking information retrieved
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TrackingResponse'
     *       404:
     *         description: Shipment not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: Shipment not found
     */
    this.get(
      '/:trackingNumber',
      validate(trackingNumberValidation, 'params'),
      shipmentController.trackShipment
    );
  }
}

module.exports = new TrackRouter().getRouter();
