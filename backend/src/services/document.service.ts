import { Service, Inject } from 'typedi';
import { DataSource, MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Document } from '../entity/Document';
import { BaseConfig } from '../config/base.config';
import { S3Service } from './s3.service';
import * as fs from 'fs/promises';
import { constants } from 'buffer';

@Service()
export class DocumentService {
    private documentRepo: MongoRepository<Document>;

    constructor(
        @Inject('DataSource') private dataSource: DataSource,
        private s3Service: S3Service
    ) {
        this.documentRepo = this.dataSource.getMongoRepository(Document);
    }

    public async createDocument(name: string, path?: string, fileBuffer?: Buffer): Promise<Document> {
        const document = new Document();
        document.name = name;
        
        // Check storage configuration and store accordingly
        if (BaseConfig.isS3Storage()) {
            console.log('File Storage: S3')
            // Store file in AWS S3
            let buffer: Buffer;
            
            if (fileBuffer) {
                buffer = fileBuffer;
            } else if (path) {
                // Read file from path to upload to S3
                buffer = await fs.readFile(path);
            } else {
                throw new Error('Either path or fileBuffer must be provided for S3 storage');
            }
            
            // Generate unique S3 key and upload
            const s3Key = this.s3Service.generateS3Key(name);
            await this.s3Service.uploadFile(s3Key, buffer);
            document.s3Key = s3Key;
            
        } else if (BaseConfig.isMongoDBStorage()) {
            console.log('File Storage: MongoDB')
            // Store file as buffer in MongoDB
            if (fileBuffer) {
                document.buffer = fileBuffer;
            } else if (path) {
                // Read file from path and store as buffer
                const content = await fs.readFile(path);
                document.buffer = content;
            } else {
                throw new Error('Either path or fileBuffer must be provided for MongoDB storage');
            }
        } else {
            console.log('File Storage: fileSystem')
            // Store file path for filesystem storage
            if (!path) {
                throw new Error('Path must be provided for filesystem storage');
            }
            document.path = path;
        }
        
        await this.documentRepo.save(document);
        return document;
    }

    public async getDocumentById(id: string): Promise<Document | null> {
        try {
            // For MongoDB with TypeORM, use ObjectId directly in the query
            const objectId = new ObjectId(id);
            const document = await this.documentRepo.findOneBy({ 
                _id: objectId 
            } as any);
            
            // Add debug logging
            if (document) {
                console.log('Document found:', { id: document.id, name: document.name, path: document.path });
            } else {
                console.log('Document not found for ID:', id);
            }
            
            return document;
        } catch (error) {
            console.error('Error fetching document by ID:', error);
            return null;
        }
    }

    public async getAllDocuments(): Promise<Document[]> {
        const documents = await this.documentRepo.find({
            order: {
                createdAt: 'DESC'
            }
        });
        return documents;
    }

    public async getDocumentContent(id: string): Promise<{ document: Document; content: string }> {
        const document = await this.getDocumentById(id);
        
        if (!document) {
            throw new Error('Document not found');
        }

        let content: string;

        try {
            // Check storage type and retrieve content accordingly
            if (BaseConfig.isS3Storage() && document.s3Key) {
                // Read content from S3
                content = await this.s3Service.downloadFile(document.s3Key);
            } else if (BaseConfig.isMongoDBStorage() && document.buffer) {
                // Read content from buffer
                content = document.buffer.toString('utf-8');
            } else if (document.path) {
                // Read content from filesystem
                content = await fs.readFile(document.path, 'utf-8');
            } else {
                throw new Error('Document has no valid storage location (s3Key, buffer, or path)');
            }

            return { document, content };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to read document content: ${errorMessage}`);
        }
    }

    public async deleteDocument(id: string): Promise<void> {
        const document = await this.getDocumentById(id);
        
        if (!document) {
            throw new Error('Document not found');
        }

        try {
            // Delete file from storage based on storage type
            if (BaseConfig.isS3Storage() && document.s3Key) {
                // Delete from S3
                await this.s3Service.deleteFile(document.s3Key);
                console.log('File deleted from S3:', document.s3Key);
            } else if (BaseConfig.isMongoDBStorage()) {
                // For MongoDB storage, buffer is stored in document, no external cleanup needed
                console.log('File stored in MongoDB, will be removed with document');
            } else if (document.path) {
                // Delete from filesystem
                try {
                    await fs.unlink(document.path);
                    console.log('File deleted from filesystem:', document.path);
                } catch (error) {
                    // Log error but don't throw - file might already be deleted
                    console.warn('Could not delete file from filesystem:', error);
                }
            }

            // Delete document record from database
            await this.documentRepo.delete(document.id);
            console.log('Document deleted from database:', document.id);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to delete document: ${errorMessage}`);
        }
    }
}
