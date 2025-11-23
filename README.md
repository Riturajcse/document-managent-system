# 📁 Document Management System

A full-stack document management application with multiple storage options (Filesystem, MongoDB, AWS S3). Built with modern technologies and comprehensive test coverage.

![Test Coverage](https://img.shields.io/badge/coverage-98.13%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🌟 Features

### Core Functionality
- ✨ **Upload Documents** - Support for text files with drag-and-drop interface
- 📋 **List Documents** - View all uploaded documents
- 👁️ **View Content** - Read document content inline
- 🗑️ **Delete Documents** - Remove documents with confirmation
- 🔄 **Real-time Updates** - Automatic list refresh after operations

### Storage Options
The application supports **three different storage mechanisms**:

1. **📂 Filesystem Storage**
   - Files stored in local `uploads/` directory
   - Fast access for development
   - Suitable for single-server deployments

2. **💾 MongoDB Storage**
   - Files stored as Buffer in MongoDB documents
   - No external file system dependencies
   - Ideal for containerized environments

3. **☁️ AWS S3 Storage**
   - Files stored in Amazon S3 bucket
   - Scalable and highly available
   - Perfect for production deployments

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Ant Design 5** - Professional UI components
- **Vite** - Lightning-fast build tool
- **Axios** - HTTP client
- **React Router DOM** - Client-side routing

#### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe development
- **TypeORM** - ORM with MongoDB support
- **Routing Controllers** - Declarative routing
- **TypeDI** - Dependency injection
- **Multer** - File upload handling
- **AWS SDK** - S3 integration

#### Database & Storage
- **MongoDB 7** - NoSQL database
- **AWS S3** - Cloud object storage (optional)
- **Local Filesystem** - File system storage (optional)

#### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving

### Project Structure

```
document-managent-system/
├── backend/                    # Backend application
│   ├── src/
│   │   ├── config/
│   │   │   └── base.config.ts # Configuration management
│   │   ├── controllers/
│   │   │   └── document.controller.ts  # API endpoints
│   │   ├── entity/
│   │   │   └── Document.ts    # TypeORM entity
│   │   ├── models/
│   │   │   ├── upload-document.request.ts
│   │   │   ├── upload-document.response.ts
│   │   │   ├── get-document-content.request.ts
│   │   │   └── get-document-content.response.ts
│   │   ├── services/
│   │   │   ├── document.service.ts  # Business logic
│   │   │   └── s3.service.ts        # AWS S3 operations
│   │   └── index.ts           # Application entry point
│   ├── tests/                 # Test suites
│   │   ├── controllers/
│   │   └── services/
│   ├── coverage/              # Test coverage reports
│   ├── Dockerfile
│   ├── package.json
│   ├── jest.config.js
│   └── .env.example
│
├── frontend/                  # Frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentList.tsx    # Main list view
│   │   │   ├── DocumentViewer.tsx  # Content viewer
│   │   │   └── UploadModal.tsx     # Upload interface
│   │   ├── hooks/
│   │   │   └── useDocuments.ts     # Custom React hook
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf             # Nginx configuration
│   ├── package.json
│   └── vite.config.ts
│
└── docker-compose.yml         # Docker Compose configuration
```

## 🚀 Getting Started

### Prerequisites

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)

### Installation & Running

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/document-managent-system.git
cd document-managent-system
```

#### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file to configure your storage type and other settings:

```env
# Application Configuration
NODE_ENV=development
PORT=9004

# MongoDB Configuration
MONGO_URI=mongodb://mongodb:27017/fileupload

# Storage Configuration
# Options: 'filesystem', 'mongodb', 's3'
STORAGE_TYPE=filesystem

# File Upload Configuration (for filesystem storage)
UPLOAD_DIR=./uploads

# AWS S3 Configuration (required if STORAGE_TYPE=s3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
S3_BUCKET_NAME=your-s3-bucket-name
```

#### 3. Run with Docker Compose

Build and start all services:

```bash
docker-compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:9005
- **Backend API**: http://localhost:9004

#### 4. Stop the Application

```bash
docker-compose down
```

To remove volumes (database data) as well:

```bash
docker-compose down -v
```

## 📦 Storage Configuration

### Option 1: Filesystem Storage (Default)

Files are stored in the `backend/uploads/` directory.

**Configuration:**
```env
STORAGE_TYPE=filesystem
UPLOAD_DIR=./uploads
```

---

### Option 2: MongoDB Storage

Files are stored as Buffer data within MongoDB documents.

**Configuration:**
```env
STORAGE_TYPE=mongodb
MONGO_URI=mongodb://mongodb:27017/fileupload
```

---

### Option 3: AWS S3 Storage

Files are stored in an Amazon S3 bucket.

**Configuration:**
```env
STORAGE_TYPE=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket-name
```

**Setup Steps:**
1. Create an S3 bucket in AWS Console
2. Create an IAM user with S3 permissions
3. Generate access keys for the IAM user
4. Configure the environment variables
5. Restart the backend service

**Required IAM Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## 🔌 API Documentation

### Base URL
```
http://localhost:9004/api
```

### Endpoints

#### 1. Upload Document
```http
POST /document/upload
Content-Type: multipart/form-data

Body:
  file: <binary>
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "document.txt",
  "path": "/uploads/1700000000-document.txt",
  "createdAt": "2023-11-23T10:00:00.000Z",
  "updatedAt": "2023-11-23T10:00:00.000Z"
}
```

---

#### 2. List Documents
```http
GET /document/list
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "document1.txt",
    "path": "/uploads/1700000000-document1.txt",
    "createdAt": "2023-11-23T10:00:00.000Z",
    "updatedAt": "2023-11-23T10:00:00.000Z"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "document2.txt",
    "path": "/uploads/1700000001-document2.txt",
    "createdAt": "2023-11-23T11:00:00.000Z",
    "updatedAt": "2023-11-23T11:00:00.000Z"
  }
]
```

---

#### 3. Get Document Content
```http
GET /document/content/:id
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "document.txt",
  "path": "/uploads/1700000000-document.txt",
  "content": "This is the content of the document..."
}
```

---

#### 4. Delete Document
```http
DELETE /document/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

#### 5. Health Check
```http
GET /document/health
```

**Response:**
```json
{
  "status": "ok"
}
```

## 🧪 Testing

### Running Tests

The backend includes comprehensive unit tests with Jest.

```bash
cd backend

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage Report

| Module | Statements | Branches | Functions | Lines |
|--------|------------|----------|-----------|-------|
| **Overall** | **98.13%** (211/215) | **93.58%** (73/78) | **85.71%** (24/28) | **98.02%** (199/203) |
| Controllers | 100% (32/32) | 100% (6/6) | 100% (7/7) | 100% (29/29) |
| Services | 100% (124/124) | 94% (47/50) | 100% (15/15) | 100% (117/117) |
| Models | 97.14% (34/35) | 75% (3/4) | 66.66% (2/3) | 97.14% (34/35) |
| Entity | 100% (11/11) | 100% (0/0) | 100% (0/0) | 100% (9/9) |
| Config | 76.92% (10/13) | 94.44% (17/18) | 0% (0/3) | 76.92% (10/13) |

### Test Suites

#### Controller Tests
- ✅ Document upload functionality
- ✅ Document listing
- ✅ Document content retrieval
- ✅ Document deletion
- ✅ Health check endpoint

#### Service Tests
- ✅ Document service CRUD operations
- ✅ Filesystem storage operations
- ✅ MongoDB storage operations
- ✅ S3 service upload/download/delete
- ✅ Error handling scenarios

### Viewing Coverage Report

After running `npm run test:coverage`, open the HTML report:

```bash
open backend/coverage/lcov-report/index.html
```

## 🐳 Docker Services

The application runs three containerized services:

### 1. MongoDB Service
```yaml
Service: mongodb
Image: mongo:7
Port: 27017 (internal)
Volume: mongodb_data:/data/db
```

### 2. Backend Service
```yaml
Service: backend
Port: 9004:9004
Volumes:
  - ./backend/uploads:/app/uploads
Environment:
  - MONGO_HOST=mongodb
  - MONGO_DB=fileupload
```

### 3. Frontend Service
```yaml
Service: frontend
Port: 9005:80
Server: Nginx
Proxy: /api → backend:9004
```

### Network

All services are connected via the `app-network` bridge network, enabling seamless inter-container communication.

### Volumes

- **mongodb_data**: Persists MongoDB data
- **./backend/uploads**: Persists uploaded files (filesystem mode)


## 📝 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | development | No |
| `PORT` | Backend server port | 9004 | No |
| `MONGO_URI` | MongoDB connection string | mongodb://mongodb:27017/fileupload | Yes |
| `STORAGE_TYPE` | Storage type (filesystem/mongodb/s3) | filesystem | Yes |
| `UPLOAD_DIR` | Upload directory path | ./uploads | If filesystem |
| `AWS_REGION` | AWS region | us-east-1 | If S3 |
| `AWS_ACCESS_KEY_ID` | AWS access key | - | If S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - | If S3 |
| `S3_BUCKET_NAME` | S3 bucket name | - | If S3 |

