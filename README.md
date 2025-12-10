# ShipTrack API 📦

A production-ready RESTful API for managing shipments, built with Node.js, Express, and MongoDB.

## 🌐 Live Demo

- **API Base URL:** `https://shipment-api-mbrc.onrender.com//api`
- **API Documentation:** `https://shipment-api-mbrc.onrender.com//api-docs`
- **Web Interface:** `https://shipment-api-mbrc.onrender.com/`

## ✨ Features

- **User Authentication** - JWT-based authentication with role-based access control
- **CRUD Operations** - Complete shipment management (Create, Read, Update, Delete)
- **Public Tracking** - Track shipments without authentication
- **File Attachments** - Upload documents and images to shipments
- **Status Management** - Track shipment status with history and transitions
- **Search & Filter** - Full-text search and filtering capabilities
- **Pagination** - Efficient data retrieval with pagination
- **Rate Limiting** - Protection against abuse
- **Input Validation** - Comprehensive request validation with Joi
- **Error Handling** - Consistent and informative error responses
- **API Documentation** - Interactive Swagger documentation
- **Web Interface** - Full EJS-based web UI

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Joi
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest
- **View Engine:** EJS

## 📁 Project Structure

```
shipment-api/
├── bin/                    # Application entry point
├── config/                 # Configuration files
├── controllers/            # Request handlers (OOP)
├── middlewares/            # Express middlewares
├── models/                 # Mongoose models
├── public/                 # Static files
│   ├── javascripts/        # Client-side JS
│   ├── stylesheets/        # CSS
│   └── uploads/            # Uploaded files
├── routes/                 # Route definitions (OOP)
│   └── v1/                 # API v1 routes
├── seeders/                # Database seeders
├── services/               # Business logic (OOP)
├── tests/                  # Test files
├── utils/                  # Utility functions
│   ├── database/           # Database connection
│   └── validations/        # Validation schemas
├── views/                  # EJS templates
│   ├── admin/              # Admin views
│   └── partials/           # Reusable partials
├── app.js                  # Express application
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/shipment-api.git
   cd shipment-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   NODE_ENV=development
   PORT=3005
   MONGODB_URI=mongodb://localhost:27017/shipment_db
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   ```

4. **Seed the database (optional)**

   ```bash
   npm run seed
   ```

5. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

6. **Access the application**
   - API: https://documenter.getpostman.com/view/15551738/2sB3dSP8Kc/api
   - Swagger Documentation: https://documenter.getpostman.com/view/15551738/2sB3dSP8Kc/api-docs
   - Swagger Documentation: https://documenter.getpostman.com/view/15551738/2sB3dSP8Kc
   - Web UI: https://documenter.getpostman.com/view/15551738/2sB3dSP8Kc

## 📖 API Documentation

### Authentication

Most endpoints require a JWT token. Include it in the Authorization header:

```
Authorization: Bearer <your-token>
```

### Endpoints

#### Authentication

| Method | Endpoint             | Description              |
| ------ | -------------------- | ------------------------ |
| POST   | `/api/auth/register` | Register new user        |
| POST   | `/api/auth/login`    | Login user               |
| GET    | `/api/auth/profile`  | Get current user profile |
| PUT    | `/api/auth/profile`  | Update profile           |
| PUT    | `/api/auth/password` | Change password          |
| PUT    | `/api/auth/avatar`   | Update avatar            |
| POST   | `/api/auth/logout`   | Logout                   |
| GET    | `/api/auth/verify`   | Verify token             |

#### Shipments

| Method | Endpoint                                       | Description            |
| ------ | ---------------------------------------------- | ---------------------- |
| GET    | `/api/shipments`                               | Get all shipments      |
| GET    | `/api/shipments/:id`                           | Get shipment by ID     |
| GET    | `/api/shipments/track/:trackingNumber`         | Get by tracking number |
| POST   | `/api/shipments`                               | Create shipment        |
| PUT    | `/api/shipments/:id`                           | Update shipment        |
| PATCH  | `/api/shipments/:id/status`                    | Update status          |
| DELETE | `/api/shipments/:id`                           | Delete shipment        |
| GET    | `/api/shipments/stats`                         | Get statistics         |
| POST   | `/api/shipments/:id/attachments`               | Add attachment         |
| DELETE | `/api/shipments/:id/attachments/:attachmentId` | Remove attachment      |

#### Public Tracking

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| GET    | `/api/track/:trackingNumber` | Track shipment (no auth) |

#### User Management (Admin)

| Method | Endpoint                    | Description      |
| ------ | --------------------------- | ---------------- |
| GET    | `/api/users`                | Get all users    |
| GET    | `/api/users/:id`            | Get user by ID   |
| PUT    | `/api/users/:id/role`       | Update user role |
| PUT    | `/api/users/:id/activate`   | Activate user    |
| PUT    | `/api/users/:id/deactivate` | Deactivate user  |
| DELETE | `/api/users/:id`            | Delete user      |

### Request/Response Examples

#### Create Shipment

```bash
curl -X POST http://localhost:3005/api/shipments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "John Doe",
    "receiverName": "Jane Smith",
    "origin": "Lagos, Nigeria",
    "destination": "Abuja, Nigeria",
    "weight": 5.5,
    "description": "Electronics package"
  }'
```

**Response:**

```json
{
	"success": true,
	"message": "Shipment created successfully",
	"data": {
		"_id": "...",
		"trackingNumber": "SHP-M5X3K9Y-ABC123",
		"senderName": "John Doe",
		"receiverName": "Jane Smith",
		"origin": "Lagos, Nigeria",
		"destination": "Abuja, Nigeria",
		"status": "pending",
		"weight": 5.5,
		"description": "Electronics package",
		"createdAt": "2024-01-15T10:30:00.000Z",
		"updatedAt": "2024-01-15T10:30:00.000Z"
	}
}
```

#### Error Response

```json
{
	"success": false,
	"message": "Validation failed",
	"errors": [
		{
			"field": "senderName",
			"message": "Sender name is required"
		}
	]
}
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Postman Collection

Import the included Postman collection for easy API testing:

1. Open Postman
2. Click "Import"
3. Select `postman_collection.json`
4. Set the `baseUrl` variable to your API URL

## 🔐 Demo Credentials

| Role    | Email               | Password    |
| ------- | ------------------- | ----------- |
| Admin   | admin@example.com   | password123 |
| Manager | manager@example.com | password123 |
| User    | user@example.com    | password123 |

## 📝 Scripts

| Script            | Description                           |
| ----------------- | ------------------------------------- |
| `npm start`       | Start production server               |
| `npm run dev`     | Start development server with nodemon |
| `npm test`        | Run tests                             |
| `npm run seed`    | Seed database with sample data        |
| `npm run gen-doc` | Generate Swagger documentation        |

## 🏗 Architecture

This project follows an **OOP (Object-Oriented Programming)** architecture with:

- **Controllers** - Handle HTTP requests and responses
- **Services** - Contain business logic
- **Models** - Define data schemas
- **Routes** - Define API endpoints
- **Middlewares** - Handle cross-cutting concerns

All controllers, services, and routes extend base classes for code reuse and consistency.

## 🛡 Security Features

- JWT authentication with configurable expiration
- Password hashing with bcrypt (12 salt rounds)
- Rate limiting (100 requests/minute, 10 auth attempts/15 min)
- Helmet security headers
- CORS configuration
- Input validation and sanitization
- Role-based access control

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 👨‍💻 Author

Samson - Backend Engineer

## 🙏 Acknowledgments

Built as part of the TaxTech Backend Engineer Assessment.

# shipment-api
