const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const config = require("./config");
const { errorHandler } = require("./utils/errorHandler");
const { loggerMiddleware } = require("./utils/logger");
const routes = require("./routes");

// Initialize express app
const app = express();

// Trust proxy for rate limiting behind reverse proxies
app.set("trust proxy", 1);

// CORS configuration
const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps, curl, postman)
		if (!origin) {
			return callback(null, true);
		}

		if (
			config.ALLOWED_ORIGINS.includes(origin) ||
			config.NODE_ENV === "development"
		) {
			callback(null, true);
		} else {
			console.warn(`CORS blocked request from origin: ${origin}`);
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
	optionsSuccessStatus: 200,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Security middleware
app.use(cors(corsOptions));
app.use(
	helmet({
		contentSecurityPolicy: false, // Disable for Swagger UI
		crossOriginEmbedderPolicy: false,
	})
);

// Rate limiting
const generalLimiter = rateLimit({
	windowMs: config.RATE_LIMIT_WINDOW_MS,
	max: config.RATE_LIMIT_MAX,
	message: {
		success: false,
		message: "Too many requests, please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => req.path === "/health" || req.path === "/",
});

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // 10 attempts per 15 minutes
	message: {
		success: false,
		message: "Too many authentication attempts, please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Request parsing
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Custom logger middleware
app.use(loggerMiddleware);

// Swagger configuration
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Shipment Management API",
			version: "1.0.0",
			description: `
A production-ready RESTful API for managing shipments.

## Features
- User authentication with JWT
- Complete CRUD operations for shipments
- Public shipment tracking
- File attachments support
- Role-based access control (Admin, Manager, User)
- Comprehensive error handling
- Request validation

## Authentication
Most endpoints require a JWT token. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## Rate Limits
- General API: ${config.RATE_LIMIT_MAX} requests per minute
- Authentication: 10 requests per 15 minutes
      `,
			contact: {
				name: "API Support",
				email: "support@example.com",
			},
			license: {
				name: "MIT",
				url: "https://opensource.org/licenses/MIT",
			},
		},
		servers: [
			{
				url: `http://localhost:${config.PORT}/api`,
				description: "Development server",
			},
		],
		tags: [
			{ name: "Authentication", description: "User authentication operations" },
			{ name: "Users", description: "User management (Admin only)" },
			{ name: "Shipments", description: "Shipment management operations" },
			{ name: "Tracking", description: "Public shipment tracking" },
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: "Enter your JWT token",
				},
			},
		},
		security: [{ bearerAuth: [] }],
	},
	apis: ["./routes/v1/*.js", "./routes/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, {
		customCss: ".swagger-ui .topbar { display: none }",
		customSiteTitle: "Shipment API Documentation",
		swaggerOptions: {
			persistAuthorization: true,
		},
	})
);

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
	res.setHeader("Content-Type", "application/json");
	res.send(swaggerSpec);
});

// Apply rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", generalLimiter);

// API Routes
app.use("/api", routes);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Server is healthy",
		timestamp: new Date().toISOString(),
		environment: config.NODE_ENV,
	});
});

// Root endpoint - redirect to documentation or UI
app.get("/", (req, res) => {
	res.render("index", {
		title: "Shipment Management System",
		apiDocsUrl: "/api-docs",
	});
});

// UI Routes (EJS views)
app.get("/dashboard", (req, res) => {
	res.render("dashboard", { title: "Dashboard", apiDocsUrl: "/api-docs" });
});

app.get("/login", (req, res) => {
	res.render("login", { title: "Login", apiDocsUrl: "/api-docs" });
});

app.get("/register", (req, res) => {
	res.render("register", { title: "Register", apiDocsUrl: "/api-docs" });
});

app.get("/shipments", (req, res) => {
	res.render("shipments", { title: "My Shipments", apiDocsUrl: "/api-docs" });
});

app.get("/shipments/new", (req, res) => {
	res.render("shipment-form", {
		title: "Create Shipment",
		mode: "create",
		apiDocsUrl: "/api-docs",
	});
});

app.get("/shipments/edit/:id", (req, res) => {
	res.render("shipment-form", {
		title: "Edit Shipment",
		mode: "edit",
		shipmentId: req.params.id,
		apiDocsUrl: "/api-docs",
	});
});

app.get("/shipments/view/:id", (req, res) => {
	res.render("shipment-detail", {
		title: "Shipment Details",
		shipmentId: req.params.id,
		apiDocsUrl: "/api-docs",
	});
});

app.get("/track", (req, res) => {
	res.render("track", { title: "Track Shipment", apiDocsUrl: "/api-docs" });
});

app.get("/profile", (req, res) => {
	res.render("profile", { title: "My Profile", apiDocsUrl: "/api-docs" });
});

// Admin routes
app.get("/admin/users", (req, res) => {
	res.render("admin/users", {
		title: "User Management",
		apiDocsUrl: "/api-docs",
	});
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404, "Resource not found"));
});

// Global error handler
app.use(errorHandler);

// Fallback error handler for rendering
app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = config.NODE_ENV === "development" ? err : {};

	// Send JSON for API requests
	if (req.path.startsWith("/api")) {
		return res.status(err.status || 500).json({
			success: false,
			message: err.message,
		});
	}

	// Render error page for browser requests
	res.status(err.status || 500);
	res.render("error", {
		title: "Error",
		message: err.message,
		error: config.NODE_ENV === "development" ? err : {},
	});
});

module.exports = app;
