const HttpError = require("../utils/httpError");

/**
 * Base Service class with common CRUD operations
 * All services should extend this class
 */
class BaseService {
	constructor(model) {
		this.model = model;
	}

	/**
	 * Create a new document
	 */
	async create(data) {
		const document = new this.model(data);
		return document.save();
	}

	/**
	 * Find all documents with optional filters
	 */
	async findAll(filter = {}, options = {}) {
		const {
			page = 1,
			limit = 10,
			sort = { createdAt: -1 },
			populate = "",
			select = "",
		} = options;

		const skip = (page - 1) * limit;

		const query = this.model.find(filter);

		if (populate) {
			query.populate(populate);
		}

		if (select) {
			query.select(select);
		}

		const [documents, total] = await Promise.all([
			query.sort(sort).skip(skip).limit(limit).lean(),
			this.model.countDocuments(filter),
		]);

		return {
			data: documents,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	/**
	 * Find one document by ID
	 */
	async findById(id, options = {}) {
		const { populate = "", select = "" } = options;

		const query = this.model.findById(id);

		if (populate) {
			query.populate(populate);
		}

		if (select) {
			query.select(select);
		}

		const document = await query;

		if (!document) {
			throw HttpError.notFound(`${this.model.modelName} not found`);
		}

		return document;
	}

	/**
	 * Find one document by filter
	 */
	async findOne(filter, options = {}) {
		const { populate = "", select = "" } = options;

		const query = this.model.findOne(filter);

		if (populate) {
			query.populate(populate);
		}

		if (select) {
			query.select(select);
		}

		return query;
	}

	/**
	 * Update a document by ID
	 */
	async updateById(id, data, options = {}) {
		const { runValidators = true, new: returnNew = true } = options;

		const document = await this.model.findByIdAndUpdate(id, data, {
			new: returnNew,
			runValidators,
		});

		if (!document) {
			throw HttpError.notFound(`${this.model.modelName} not found`);
		}

		return document;
	}

	/**
	 * Delete a document by ID
	 */
	async deleteById(id) {
		const document = await this.model.findByIdAndDelete(id);

		if (!document) {
			throw HttpError.notFound(`${this.model.modelName} not found`);
		}

		return document;
	}

	/**
	 * Count documents matching filter
	 */
	async count(filter = {}) {
		return this.model.countDocuments(filter);
	}

	/**
	 * Check if document exists
	 */
	async exists(filter) {
		const count = await this.model.countDocuments(filter);
		return count > 0;
	}

	/**
	 * Bulk create documents
	 */
	async bulkCreate(documents) {
		return this.model.insertMany(documents);
	}

	/**
	 * Bulk update documents
	 */
	async bulkUpdate(filter, update) {
		return this.model.updateMany(filter, update);
	}

	/**
	 * Bulk delete documents
	 */
	async bulkDelete(filter) {
		return this.model.deleteMany(filter);
	}
}

module.exports = BaseService;
