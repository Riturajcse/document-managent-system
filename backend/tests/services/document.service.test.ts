import { DocumentService } from '../../src/services/document.service';
import { S3Service } from '../../src/services/s3.service';
import { DataSource, MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Document } from '../../src/entity/Document';
import { BaseConfig } from '../../src/config/base.config';
import * as fs from 'fs/promises';

// Mock dependencies
jest.mock('../../src/services/s3.service');
jest.mock('../../src/config/base.config');
jest.mock('fs/promises');

describe('DocumentService', () => {
    let documentService: DocumentService;
    let mockDataSource: any;
    let mockDocumentRepo: any;
    let mockS3Service: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock repository
        mockDocumentRepo = {
            save: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
        };

        // Mock data source
        mockDataSource = {
            getMongoRepository: jest.fn().mockReturnValue(mockDocumentRepo),
        };

        // Mock S3 service
        mockS3Service = {
            generateS3Key: jest.fn().mockReturnValue('test-s3-key'),
            uploadFile: jest.fn().mockResolvedValue('test-s3-key'),
            downloadFile: jest.fn().mockResolvedValue('test file content'),
        };

        documentService = new DocumentService(mockDataSource, mockS3Service);
    });

    describe('createDocument', () => {
        describe('S3 Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(true);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);
            });

            it('should create document with fileBuffer in S3 storage', async () => {
                const name = 'test.txt';
                const fileBuffer = Buffer.from('test content');
                const mockDocument = new Document();

                mockDocumentRepo.save.mockResolvedValueOnce(mockDocument);

                const result = await documentService.createDocument(name, undefined, fileBuffer);

                expect(mockS3Service.generateS3Key).toHaveBeenCalledWith(name);
                expect(mockS3Service.uploadFile).toHaveBeenCalledWith('test-s3-key', fileBuffer);
                expect(mockDocumentRepo.save).toHaveBeenCalled();
                expect(result.name).toBe(name);
                expect(result.s3Key).toBe('test-s3-key');
            });

            it('should create document by reading file from path in S3 storage', async () => {
                const name = 'test.txt';
                const path = '/tmp/test.txt';
                const fileContent = Buffer.from('test content');
                const mockDocument = new Document();

                (fs.readFile as jest.Mock).mockResolvedValueOnce(fileContent);
                mockDocumentRepo.save.mockResolvedValueOnce(mockDocument);

                const result = await documentService.createDocument(name, path);

                expect(fs.readFile).toHaveBeenCalledWith(path);
                expect(mockS3Service.generateS3Key).toHaveBeenCalledWith(name);
                expect(mockS3Service.uploadFile).toHaveBeenCalledWith('test-s3-key', fileContent);
                expect(mockDocumentRepo.save).toHaveBeenCalled();
            });

            it('should throw error when neither path nor fileBuffer provided for S3', async () => {
                const name = 'test.txt';

                await expect(documentService.createDocument(name)).rejects.toThrow(
                    'Either path or fileBuffer must be provided for S3 storage'
                );
            });
        });

        describe('MongoDB Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(true);
            });

            it('should create document with fileBuffer in MongoDB storage', async () => {
                const name = 'test.txt';
                const fileBuffer = Buffer.from('test content');
                const mockDocument = new Document();

                mockDocumentRepo.save.mockResolvedValueOnce(mockDocument);

                const result = await documentService.createDocument(name, undefined, fileBuffer);

                expect(mockDocumentRepo.save).toHaveBeenCalled();
                expect(result.name).toBe(name);
                expect(result.buffer).toEqual(fileBuffer);
            });

            it('should create document by reading file from path in MongoDB storage', async () => {
                const name = 'test.txt';
                const path = '/tmp/test.txt';
                const fileContent = Buffer.from('test content');
                const mockDocument = new Document();

                (fs.readFile as jest.Mock).mockResolvedValueOnce(fileContent);
                mockDocumentRepo.save.mockResolvedValueOnce(mockDocument);

                const result = await documentService.createDocument(name, path);

                expect(fs.readFile).toHaveBeenCalledWith(path);
                expect(mockDocumentRepo.save).toHaveBeenCalled();
            });

            it('should throw error when neither path nor fileBuffer provided for MongoDB', async () => {
                const name = 'test.txt';

                await expect(documentService.createDocument(name)).rejects.toThrow(
                    'Either path or fileBuffer must be provided for MongoDB storage'
                );
            });
        });

        describe('Filesystem Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);
            });

            it('should create document with path in filesystem storage', async () => {
                const name = 'test.txt';
                const path = '/tmp/test.txt';
                const mockDocument = new Document();

                mockDocumentRepo.save.mockResolvedValueOnce(mockDocument);

                const result = await documentService.createDocument(name, path);

                expect(mockDocumentRepo.save).toHaveBeenCalled();
                expect(result.name).toBe(name);
                expect(result.path).toBe(path);
            });

            it('should throw error when path not provided for filesystem storage', async () => {
                const name = 'test.txt';
                const fileBuffer = Buffer.from('test content');

                await expect(documentService.createDocument(name, undefined, fileBuffer)).rejects.toThrow(
                    'Path must be provided for filesystem storage'
                );
            });
        });
    });

    describe('getDocumentById', () => {
        it('should return document when found', async () => {
            const id = '507f1f77bcf86cd799439011';
            const mockDocument = new Document();
            mockDocument.id = new ObjectId(id);
            mockDocument.name = 'test.txt';

            mockDocumentRepo.findOneBy.mockResolvedValueOnce(mockDocument);

            const result = await documentService.getDocumentById(id);

            expect(result).toBe(mockDocument);
            expect(mockDocumentRepo.findOneBy).toHaveBeenCalledWith({ _id: expect.any(ObjectId) });
        });

        it('should return null when document not found', async () => {
            const id = '507f1f77bcf86cd799439011';

            mockDocumentRepo.findOneBy.mockResolvedValueOnce(null);

            const result = await documentService.getDocumentById(id);

            expect(result).toBeNull();
        });

        it('should return null when error occurs', async () => {
            const id = 'invalid-id';

            mockDocumentRepo.findOneBy.mockRejectedValueOnce(new Error('Invalid ObjectId'));

            const result = await documentService.getDocumentById(id);

            expect(result).toBeNull();
        });
    });

    describe('getAllDocuments', () => {
        it('should return all documents ordered by createdAt DESC', async () => {
            const mockDocuments = [
                Object.assign(new Document(), { name: 'doc1.txt', createdAt: new Date('2023-01-02') }),
                Object.assign(new Document(), { name: 'doc2.txt', createdAt: new Date('2023-01-01') }),
            ];

            mockDocumentRepo.find.mockResolvedValueOnce(mockDocuments);

            const result = await documentService.getAllDocuments();

            expect(result).toEqual(mockDocuments);
            expect(mockDocumentRepo.find).toHaveBeenCalledWith({
                order: {
                    createdAt: 'DESC',
                },
            });
        });

        it('should return empty array when no documents exist', async () => {
            mockDocumentRepo.find.mockResolvedValueOnce([]);

            const result = await documentService.getAllDocuments();

            expect(result).toEqual([]);
        });
    });

    describe('getDocumentContent', () => {
        const mockDocument = Object.assign(new Document(), {
            id: new ObjectId('507f1f77bcf86cd799439011'),
            name: 'test.txt',
        });

        it('should throw error when document not found', async () => {
            const id = '507f1f77bcf86cd799439011';
            mockDocumentRepo.findOneBy.mockResolvedValueOnce(null);

            await expect(documentService.getDocumentContent(id)).rejects.toThrow('Document not found');
        });

        describe('S3 Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(true);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);
            });

            it('should retrieve content from S3', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithS3 = Object.assign(new Document(), {
                    ...mockDocument,
                    s3Key: 'test-s3-key',
                });

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithS3);
                mockS3Service.downloadFile.mockResolvedValueOnce('S3 file content');

                const result = await documentService.getDocumentContent(id);

                expect(result.document).toBe(documentWithS3);
                expect(result.content).toBe('S3 file content');
                expect(mockS3Service.downloadFile).toHaveBeenCalledWith('test-s3-key');
            });

            it('should throw error when s3Key is missing', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithoutS3 = Object.assign(new Document(), mockDocument);

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithoutS3);

                await expect(documentService.getDocumentContent(id)).rejects.toThrow(
                    'Document has no valid storage location'
                );
            });
        });

        describe('MongoDB Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(true);
            });

            it('should retrieve content from buffer', async () => {
                const id = '507f1f77bcf86cd799439011';
                const content = 'MongoDB file content';
                const documentWithBuffer = Object.assign(new Document(), {
                    ...mockDocument,
                    buffer: Buffer.from(content),
                });

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithBuffer);

                const result = await documentService.getDocumentContent(id);

                expect(result.document).toBe(documentWithBuffer);
                expect(result.content).toBe(content);
            });

            it('should throw error when buffer is missing', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithoutBuffer = Object.assign(new Document(), mockDocument);

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithoutBuffer);

                await expect(documentService.getDocumentContent(id)).rejects.toThrow(
                    'Document has no valid storage location'
                );
            });
        });

        describe('Filesystem Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);
            });

            it('should retrieve content from filesystem', async () => {
                const id = '507f1f77bcf86cd799439011';
                const content = 'Filesystem file content';
                const documentWithPath = Object.assign(new Document(), {
                    ...mockDocument,
                    path: '/tmp/test.txt',
                });

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithPath);
                (fs.readFile as jest.Mock).mockResolvedValueOnce(content);

                const result = await documentService.getDocumentContent(id);

                expect(result.document).toBe(documentWithPath);
                expect(result.content).toBe(content);
                expect(fs.readFile).toHaveBeenCalledWith('/tmp/test.txt', 'utf-8');
            });

            it('should throw error when path is missing', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithoutPath = Object.assign(new Document(), mockDocument);

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithoutPath);

                await expect(documentService.getDocumentContent(id)).rejects.toThrow(
                    'Document has no valid storage location'
                );
            });

            it('should handle filesystem read errors', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithPath = Object.assign(new Document(), {
                    ...mockDocument,
                    path: '/tmp/test.txt',
                });

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithPath);
                (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

                await expect(documentService.getDocumentContent(id)).rejects.toThrow(
                    'Failed to read document content: File not found'
                );
            });
        });
    });

    describe('deleteDocument', () => {
        const mockDocument = Object.assign(new Document(), {
            id: new ObjectId('507f1f77bcf86cd799439011'),
            name: 'test.txt',
        });

        beforeEach(() => {
            mockDocumentRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });
            mockS3Service.deleteFile = jest.fn().mockResolvedValue(undefined);
            (fs.unlink as jest.Mock).mockResolvedValue(undefined);
        });

        it('should throw error when document not found', async () => {
            const id = '507f1f77bcf86cd799439011';
            mockDocumentRepo.findOneBy.mockResolvedValueOnce(null);

            await expect(documentService.deleteDocument(id)).rejects.toThrow('Document not found');
        });

        describe('S3 Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(true);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);
            });

            it('should delete document from S3 and database', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithS3 = Object.assign(new Document(), {
                    ...mockDocument,
                    s3Key: 'test-s3-key',
                });

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithS3);

                await documentService.deleteDocument(id);

                expect(mockS3Service.deleteFile).toHaveBeenCalledWith('test-s3-key');
                expect(mockDocumentRepo.delete).toHaveBeenCalledWith(documentWithS3.id);
            });

            it('should handle S3 deletion errors', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithS3 = Object.assign(new Document(), {
                    ...mockDocument,
                    s3Key: 'test-s3-key',
                });

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithS3);
                mockS3Service.deleteFile.mockRejectedValueOnce(new Error('S3 deletion failed'));

                await expect(documentService.deleteDocument(id)).rejects.toThrow(
                    'Failed to delete document: S3 deletion failed'
                );
            });
        });

        describe('MongoDB Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(true);
            });

            it('should delete document from database (buffer stored in document)', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithBuffer = Object.assign(new Document(), {
                    ...mockDocument,
                    buffer: Buffer.from('test content'),
                });

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithBuffer);

                await documentService.deleteDocument(id);

                expect(mockDocumentRepo.delete).toHaveBeenCalledWith(documentWithBuffer.id);
                expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
                expect(fs.unlink).not.toHaveBeenCalled();
            });
        });

        describe('Filesystem Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);
            });

            it('should delete file from filesystem and database', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithPath = Object.assign(new Document(), {
                    ...mockDocument,
                    path: '/tmp/test.txt',
                });

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithPath);

                await documentService.deleteDocument(id);

                expect(fs.unlink).toHaveBeenCalledWith('/tmp/test.txt');
                expect(mockDocumentRepo.delete).toHaveBeenCalledWith(documentWithPath.id);
            });

            it('should continue deletion even if file deletion fails', async () => {
                const id = '507f1f77bcf86cd799439011';
                const documentWithPath = Object.assign(new Document(), {
                    ...mockDocument,
                    path: '/tmp/test.txt',
                });

                mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithPath);
                (fs.unlink as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

                await documentService.deleteDocument(id);

                expect(fs.unlink).toHaveBeenCalledWith('/tmp/test.txt');
                expect(mockDocumentRepo.delete).toHaveBeenCalledWith(documentWithPath.id);
            });
        });

        it('should handle database deletion errors', async () => {
            const id = '507f1f77bcf86cd799439011';
            const documentWithPath = Object.assign(new Document(), {
                ...mockDocument,
                path: '/tmp/test.txt',
            });

            (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(false);
            (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);

            mockDocumentRepo.findOneBy.mockResolvedValueOnce(documentWithPath);
            mockDocumentRepo.delete.mockRejectedValueOnce(new Error('Database error'));

            await expect(documentService.deleteDocument(id)).rejects.toThrow(
                'Failed to delete document: Database error'
            );
        });
    });
});
