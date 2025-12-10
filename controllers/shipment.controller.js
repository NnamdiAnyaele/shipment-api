const BaseController = require('./base.controller');
const { shipmentService } = require('../services');
const ApiResponse = require('../utils/apiResponse');
const { processFilesInfo, processFileInfo, deleteFile } = require('../middlewares/upload.middleware');
const { USER_ROLES } = require('../utils/enums');

/**
 * Shipment Controller class
 * Handles all shipment-related HTTP requests
 */
class ShipmentController extends BaseController {
  constructor() {
    super(shipmentService, 'Shipment');
  }

  /**
   * Create a new shipment
   * POST /api/shipments
   */
  async create(req, res) {
    const shipmentData = { ...req.body };
    
    // Handle file attachments if present
    if (req.files && req.files.length > 0) {
      shipmentData.attachments = processFilesInfo(req.files);
    }

    const shipment = await this.service.createShipment(
      shipmentData,
      req.user._id
    );

    this.logAction('created shipment', req.user._id, shipment._id);

    return ApiResponse.created(
      res,
      shipment,
      'Shipment created successfully'
    );
  }

  /**
   * Get all shipments with filters
   * GET /api/shipments
   */
  async getAll(req, res) {
    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      status: req.query.status,
      search: req.query.search,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      // Non-admins can only see their own shipments
      userId: isAdmin ? req.query.userId : req.user._id,
    };

    const result = await this.service.getShipments(options);

    return ApiResponse.paginated(
      res,
      result.shipments,
      result.pagination,
      'Shipments retrieved successfully'
    );
  }

  /**
   * Get a single shipment by ID
   * GET /api/shipments/:id
   */
  async getById(req, res) {
    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    
    const shipment = await this.service.getShipmentById(
      req.params.id,
      req.user._id.toString(),
      isAdmin
    );

    return ApiResponse.success(
      res,
      shipment,
      'Shipment retrieved successfully'
    );
  }

  /**
   * Get shipment by tracking number
   * GET /api/shipments/track/:trackingNumber
   */
  async getByTrackingNumber(req, res) {
    const shipment = await this.service.getShipmentByTrackingNumber(
      req.params.trackingNumber
    );

    return ApiResponse.success(
      res,
      shipment,
      'Shipment retrieved successfully'
    );
  }

  /**
   * Track shipment (public endpoint)
   * GET /api/track/:trackingNumber
   */
  async trackShipment(req, res) {
    const shipment = await this.service.trackShipment(
      req.params.trackingNumber
    );

    return ApiResponse.success(
      res,
      shipment,
      'Shipment tracking information retrieved'
    );
  }

  /**
   * Update a shipment
   * PUT /api/shipments/:id
   */
  async update(req, res) {
    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    
    const shipment = await this.service.updateShipment(
      req.params.id,
      req.body,
      req.user._id.toString(),
      isAdmin
    );

    this.logAction('updated shipment', req.user._id, req.params.id);

    return ApiResponse.success(
      res,
      shipment,
      'Shipment updated successfully'
    );
  }

  /**
   * Update shipment status
   * PATCH /api/shipments/:id/status
   */
  async updateStatus(req, res) {
    const { status, notes } = req.body;
    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    
    const shipment = await this.service.updateStatus(
      req.params.id,
      status,
      req.user._id.toString(),
      notes,
      isAdmin
    );

    this.logAction(`updated shipment status to ${status}`, req.user._id, req.params.id);

    return ApiResponse.success(
      res,
      shipment,
      'Shipment status updated successfully'
    );
  }

  /**
   * Delete a shipment
   * DELETE /api/shipments/:id
   */
  async delete(req, res) {
    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    
    await this.service.deleteShipment(
      req.params.id,
      req.user._id.toString(),
      isAdmin
    );

    this.logAction('deleted shipment', req.user._id, req.params.id);

    return ApiResponse.success(
      res,
      null,
      'Shipment deleted successfully'
    );
  }

  /**
   * Add attachment to shipment
   * POST /api/shipments/:id/attachments
   */
  async addAttachment(req, res) {
    if (!req.file) {
      return ApiResponse.error(res, 'Please upload a file', 400);
    }

    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    const attachment = processFileInfo(req.file);
    
    const shipment = await this.service.addAttachment(
      req.params.id,
      attachment,
      req.user._id.toString(),
      isAdmin
    );

    this.logAction('added attachment to shipment', req.user._id, req.params.id);

    return ApiResponse.success(
      res,
      shipment,
      'Attachment added successfully'
    );
  }

  /**
   * Remove attachment from shipment
   * DELETE /api/shipments/:id/attachments/:attachmentId
   */
  async removeAttachment(req, res) {
    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    
    const shipment = await this.service.removeAttachment(
      req.params.id,
      req.params.attachmentId,
      req.user._id.toString(),
      isAdmin
    );

    this.logAction('removed attachment from shipment', req.user._id, req.params.id);

    return ApiResponse.success(
      res,
      shipment,
      'Attachment removed successfully'
    );
  }

  /**
   * Get shipment statistics
   * GET /api/shipments/stats
   */
  async getStatistics(req, res) {
    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    
    // Admins can get global stats or specify a user
    // Regular users only get their own stats
    const userId = isAdmin && req.query.userId 
      ? req.query.userId 
      : (isAdmin ? null : req.user._id);
    
    const stats = await this.service.getStatistics(userId);

    return ApiResponse.success(
      res,
      stats,
      'Shipment statistics retrieved successfully'
    );
  }

  /**
   * Get user's own shipment statistics
   * GET /api/shipments/my-stats
   */
  async getMyStatistics(req, res) {
    const stats = await this.service.getStatistics(req.user._id);

    return ApiResponse.success(
      res,
      stats,
      'Your shipment statistics retrieved successfully'
    );
  }
}

module.exports = new ShipmentController();
