import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { DataSource } from 'typeorm';
import { Document } from './entity/Document';
import { DocumentController } from './controllers';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const PORT = 9004;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadsDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Initialize TypeORM DataSource
const AppDataSource = new DataSource({
  type: 'mongodb',
  host: process.env.MONGO_HOST || 'mongodb',
  port: 27017,
  database: process.env.MONGO_DB || 'fileupload',
  synchronize: true,
  logging: false,
  entities: [Document]
});

// Use typedi container for dependency injection
useContainer(Container);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');

    // Register DataSource in TypeDI container
    Container.set('DataSource', AppDataSource);

    // Create express app
    const app = express();
    
    // Enable CORS
    app.use(cors());
    
    // Configure multer for the specific upload route
    const upload = multer({ storage });
    app.post('/api/document/upload', (upload.single('file') as any), (req: any, res, next) => {
      // Multer has processed the file, continue to routing-controllers
      next();
    });
    
    // Setup routing-controllers
    useExpressServer(app, {
      controllers: [DocumentController],
      routePrefix: '/api',
      defaultErrorHandler: false
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
