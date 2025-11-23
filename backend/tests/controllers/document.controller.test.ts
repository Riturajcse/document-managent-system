import { DocumentController } from '../../src/controllers/document.controller';
import { DocumentService } from '../../src/services/document.service';
import { Document } from '../../src/entity/Document';
import { UploadDocumentResponse, GetDocumentContentResponse } from '../../src/models';
import { BaseConfig } from '../../src/config/base.config';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('../../src/services/document.service');
jest.mock('../../src/config/base.config');

describe('DocumentController', () => {
    let documentController: DocumentController;
    let mockDocumentService: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock DocumentService
        mockDocumentService = {
            createDocument: jest.fn(),
            getAllDocuments: jest.fn(),
            getDocumentContent: jest.fn(),
            deleteDocument: jest.fn(),
        };

        documentController = new DocumentController(mockDocumentService);
    });

    describe('uploadDocument', () => {
        const mockFile = {
            originalname: 'test.txt',
            filename: 'test-123.txt',
            path: '/tmp/test-123.txt',
            size: 1024,
            buffer: Buffer.from('test content'),
        } as Express.Multer.File;

        it('should throw error when no file uploaded', async () => {
            const mockRequest = {} as any;

            await expect(documentController.uploadDocument(mockRequest)).rejects.toThrow('No file uploaded');
        });

        describe('S3 Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(true);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig as any).STORAGE_TYPE = 's3';
            });

            it('should upload document to S3 with buffer', async () => {
                const mockDocument = Object.assign(new Document(), {
                    id: new ObjectId(),
                    name: 'test.txt',
                    s3Key: 'test-s3-key',
                });

                mockDocumentService.createDocument.mockResolvedValueOnce(mockDocument);

                const mockRequest = {
                    file: mockFile,
                } as any;

                const result = await documentController.uploadDocument(mockRequest);

                expect(mockDocumentService.createDocument).toHaveBeenCalledWith(
                    'test.txt',
                    undefined,
                    mockFile.buffer
                );
                expect(result).toBeInstanceOf(UploadDocumentResponse);
            });
        });

        describe('MongoDB Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(true);
                (BaseConfig as any).STORAGE_TYPE = 'mongodb';
            });

            it('should upload document to MongoDB with buffer', async () => {
                const mockDocument = Object.assign(new Document(), {
                    id: new ObjectId(),
                    name: 'test.txt',
                    buffer: Buffer.from('test content'),
                });

                mockDocumentService.createDocument.mockResolvedValueOnce(mockDocument);

                const mockRequest = {
                    file: mockFile,
                } as any;

                const result = await documentController.uploadDocument(mockRequest);

                expect(mockDocumentService.createDocument).toHaveBeenCalledWith(
                    'test.txt',
                    undefined,
                    mockFile.buffer
                );
                expect(result).toBeInstanceOf(UploadDocumentResponse);
            });
        });

        describe('Filesystem Storage', () => {
            beforeEach(() => {
                (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);
                (BaseConfig as any).STORAGE_TYPE = 'filesystem';
            });

            it('should upload document to filesystem with path', async () => {
                const mockDocument = Object.assign(new Document(), {
                    id: new ObjectId(),
                    name: 'test.txt',
                    path: '/tmp/test-123.txt',
                });

                mockDocumentService.createDocument.mockResolvedValueOnce(mockDocument);

                const mockRequest = {
                    file: mockFile,
                } as any;

                const result = await documentController.uploadDocument(mockRequest);

                expect(mockDocumentService.createDocument).toHaveBeenCalledWith(
                    'test.txt',
                    '/tmp/test-123.txt'
                );
                expect(result).toBeInstanceOf(UploadDocumentResponse);
            });
        });

        it('should handle upload errors', async () => {
            (BaseConfig.isS3Storage as jest.Mock) = jest.fn().mockReturnValue(true);
            (BaseConfig.isMongoDBStorage as jest.Mock) = jest.fn().mockReturnValue(false);

            const mockRequest = {
                file: mockFile,
            } as any;

            const error = new Error('Upload failed');
            mockDocumentService.createDocument.mockRejectedValueOnce(error);

            await expect(documentController.uploadDocument(mockRequest)).rejects.toThrow('Upload failed');
        });
    });

    describe('listDocuments', () => {
        it('should return list of documents', async () => {
            const mockDocuments = [
                Object.assign(new Document(), {
                    id: new ObjectId('507f1f77bcf86cd799439011'),
                    name: 'doc1.txt',
                    path: '/tmp/doc1.txt',
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2023-01-01'),
                }),
                Object.assign(new Document(), {
                    id: new ObjectId('507f1f77bcf86cd799439012'),
                    name: 'doc2.txt',
                    path: '/tmp/doc2.txt',
                    createdAt: new Date('2023-01-02'),
                    updatedAt: new Date('2023-01-02'),
                }),
            ];

            mockDocumentService.getAllDocuments.mockResolvedValueOnce(mockDocuments);

            const result = await documentController.listDocuments();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: '507f1f77bcf86cd799439011',
                name: 'doc1.txt',
                path: '/tmp/doc1.txt',
                createdAt: mockDocuments[0].createdAt,
                updatedAt: mockDocuments[0].updatedAt,
            });
            expect(result[1]).toEqual({
                id: '507f1f77bcf86cd799439012',
                name: 'doc2.txt',
                path: '/tmp/doc2.txt',
                createdAt: mockDocuments[1].createdAt,
                updatedAt: mockDocuments[1].updatedAt,
            });
            expect(mockDocumentService.getAllDocuments).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when no documents exist', async () => {
            mockDocumentService.getAllDocuments.mockResolvedValueOnce([]);

            const result = await documentController.listDocuments();

            expect(result).toEqual([]);
            expect(mockDocumentService.getAllDocuments).toHaveBeenCalledTimes(1);
        });

        it('should handle errors when listing documents', async () => {
            const error = new Error('Database error');
            mockDocumentService.getAllDocuments.mockRejectedValueOnce(error);

            await expect(documentController.listDocuments()).rejects.toThrow('Database error');
        });
    });

    describe('getDocumentContent', () => {
        it('should return document content successfully', async () => {
            const mockDocument = Object.assign(new Document(), {
                id: new ObjectId('507f1f77bcf86cd799439011'),
                name: 'test.txt',
                path: '/tmp/test.txt',
            });

            const mockContent = 'This is test content';

            mockDocumentService.getDocumentContent.mockResolvedValueOnce({
                document: mockDocument,
                content: mockContent,
            });

            const result = await documentController.getDocumentContent('507f1f77bcf86cd799439011');

            expect(result).toBeInstanceOf(GetDocumentContentResponse);
            expect(mockDocumentService.getDocumentContent).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        });

        it('should handle document not found error', async () => {
            const error = new Error('Document not found');
            mockDocumentService.getDocumentContent.mockRejectedValueOnce(error);

            await expect(documentController.getDocumentContent('invalid-id')).rejects.toThrow('Document not found');
        });

        it('should handle errors when reading document content', async () => {
            const error = new Error('Failed to read content');
            mockDocumentService.getDocumentContent.mockRejectedValueOnce(error);

            await expect(documentController.getDocumentContent('507f1f77bcf86cd799439011')).rejects.toThrow(
                'Failed to read content'
            );
        });
    });

    describe('deleteDocument', () => {
        it('should delete document successfully', async () => {
            const id = '507f1f77bcf86cd799439011';

            mockDocumentService.deleteDocument.mockResolvedValueOnce(undefined);

            const result = await documentController.deleteDocument(id);

            expect(result).toEqual({
                success: true,
                message: 'Document deleted successfully',
            });
            expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(id);
            expect(mockDocumentService.deleteDocument).toHaveBeenCalledTimes(1);
        });

        it('should handle document not found error', async () => {
            const id = 'invalid-id';
            const error = new Error('Document not found');
            
            mockDocumentService.deleteDocument.mockRejectedValueOnce(error);

            await expect(documentController.deleteDocument(id)).rejects.toThrow('Document not found');
            expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(id);
        });

        it('should handle deletion errors', async () => {
            const id = '507f1f77bcf86cd799439011';
            const error = new Error('Failed to delete document: S3 deletion failed');
            
            mockDocumentService.deleteDocument.mockRejectedValueOnce(error);

            await expect(documentController.deleteDocument(id)).rejects.toThrow(
                'Failed to delete document: S3 deletion failed'
            );
        });

        it('should handle database errors during deletion', async () => {
            const id = '507f1f77bcf86cd799439011';
            const error = new Error('Failed to delete document: Database error');
            
            mockDocumentService.deleteDocument.mockRejectedValueOnce(error);

            await expect(documentController.deleteDocument(id)).rejects.toThrow(
                'Failed to delete document: Database error'
            );
        });
    });

    describe('health', () => {
        it('should return health status', async () => {
            const result = await documentController.health();

            expect(result).toEqual({ status: 'ok' });
        });
    });
});
