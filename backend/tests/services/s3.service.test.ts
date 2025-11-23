import { S3Service } from '../../src/services/s3.service';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { BaseConfig } from '../../src/config/base.config';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('../../src/config/base.config');

describe('S3Service', () => {
    let s3Service: S3Service;
    let mockS3Client: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock BaseConfig
        (BaseConfig as any).S3_BUCKET_NAME = 'test-bucket';
        (BaseConfig as any).AWS_REGION = 'us-east-1';
        (BaseConfig as any).AWS_ACCESS_KEY_ID = 'test-access-key';
        (BaseConfig as any).AWS_SECRET_ACCESS_KEY = 'test-secret-key';

        // Mock S3Client
        mockS3Client = {
            send: jest.fn(),
        };

        (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(() => mockS3Client);

        s3Service = new S3Service();
    });

    describe('uploadFile', () => {
        it('should upload a file to S3 successfully', async () => {
            const testKey = 'test-file.txt';
            const testBuffer = Buffer.from('test content');
            const testContentType = 'text/plain';

            mockS3Client.send.mockResolvedValueOnce({});

            const result = await s3Service.uploadFile(testKey, testBuffer, testContentType);

            expect(result).toBe(testKey);
            expect(mockS3Client.send).toHaveBeenCalledTimes(1);
            expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        });

        it('should upload a file without content type', async () => {
            const testKey = 'test-file.txt';
            const testBuffer = Buffer.from('test content');

            mockS3Client.send.mockResolvedValueOnce({});

            const result = await s3Service.uploadFile(testKey, testBuffer);

            expect(result).toBe(testKey);
            expect(mockS3Client.send).toHaveBeenCalledTimes(1);
        });

        it('should throw an error when upload fails', async () => {
            const testKey = 'test-file.txt';
            const testBuffer = Buffer.from('test content');
            const errorMessage = 'Upload failed';

            mockS3Client.send.mockRejectedValueOnce(new Error(errorMessage));

            await expect(s3Service.uploadFile(testKey, testBuffer)).rejects.toThrow(
                `Failed to upload file to S3: ${errorMessage}`
            );
        });

        it('should handle non-Error upload failures', async () => {
            const testKey = 'test-file.txt';
            const testBuffer = Buffer.from('test content');

            mockS3Client.send.mockRejectedValueOnce('String error');

            await expect(s3Service.uploadFile(testKey, testBuffer)).rejects.toThrow(
                'Failed to upload file to S3: Unknown error'
            );
        });
    });

    describe('downloadFile', () => {
        it('should download a file from S3 successfully', async () => {
            const testKey = 'test-file.txt';
            const testContent = 'test content';
            const mockStream = new Readable();
            mockStream.push(testContent);
            mockStream.push(null);

            mockS3Client.send.mockResolvedValueOnce({
                Body: mockStream,
            });

            const result = await s3Service.downloadFile(testKey);

            expect(result).toBe(testContent);
            expect(mockS3Client.send).toHaveBeenCalledTimes(1);
            expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
        });

        it('should throw an error when response has no body', async () => {
            const testKey = 'test-file.txt';

            mockS3Client.send.mockResolvedValueOnce({
                Body: undefined,
            });

            await expect(s3Service.downloadFile(testKey)).rejects.toThrow(
                'Failed to download file from S3: No content in S3 response'
            );
        });

        it('should throw an error when download fails', async () => {
            const testKey = 'test-file.txt';
            const errorMessage = 'Download failed';

            mockS3Client.send.mockRejectedValueOnce(new Error(errorMessage));

            await expect(s3Service.downloadFile(testKey)).rejects.toThrow(
                `Failed to download file from S3: ${errorMessage}`
            );
        });

        it('should handle stream errors during download', async () => {
            const testKey = 'test-file.txt';
            const mockStream = new Readable();
            const streamError = new Error('Stream error');

            mockS3Client.send.mockResolvedValueOnce({
                Body: mockStream,
            });

            // Create a promise that will be rejected when the stream emits an error
            const downloadPromise = s3Service.downloadFile(testKey);
            
            // Emit error immediately
            process.nextTick(() => mockStream.emit('error', streamError));

            await expect(downloadPromise).rejects.toThrow(streamError);
        });

        it('should handle non-Error download failures', async () => {
            const testKey = 'test-file.txt';

            mockS3Client.send.mockRejectedValueOnce('String error');

            await expect(s3Service.downloadFile(testKey)).rejects.toThrow(
                'Failed to download file from S3: Unknown error'
            );
        });
    });

    describe('deleteFile', () => {
        it('should delete a file from S3 successfully', async () => {
            const testKey = 'test-file.txt';

            mockS3Client.send.mockResolvedValueOnce({});

            await s3Service.deleteFile(testKey);

            expect(mockS3Client.send).toHaveBeenCalledTimes(1);
            expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
        });

        it('should throw an error when delete fails', async () => {
            const testKey = 'test-file.txt';
            const errorMessage = 'Delete failed';

            mockS3Client.send.mockRejectedValueOnce(new Error(errorMessage));

            await expect(s3Service.deleteFile(testKey)).rejects.toThrow(
                `Failed to delete file from S3: ${errorMessage}`
            );
        });

        it('should handle non-Error delete failures', async () => {
            const testKey = 'test-file.txt';

            mockS3Client.send.mockRejectedValueOnce('String error');

            await expect(s3Service.deleteFile(testKey)).rejects.toThrow(
                'Failed to delete file from S3: Unknown error'
            );
        });
    });

    describe('generateS3Key', () => {
        it('should generate a unique S3 key with timestamp and random string', () => {
            const originalName = 'test-file.txt';
            const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
            const mathSpy = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

            const result = s3Service.generateS3Key(originalName);

            expect(result).toMatch(/^documents\/\d+-[a-z0-9]+-test-file\.txt$/);
            expect(result).toContain('documents/');
            expect(result).toContain('test-file.txt');

            dateSpy.mockRestore();
            mathSpy.mockRestore();
        });

        it('should sanitize filenames with special characters', () => {
            const originalName = 'test file@#$%^&*().txt';

            const result = s3Service.generateS3Key(originalName);

            expect(result).toMatch(/^documents\/\d+-[a-z0-9]+-test_file_________\.txt$/);
            expect(result).not.toContain('@');
            expect(result).not.toContain('#');
            expect(result).not.toContain('$');
            expect(result).not.toContain(' ');
            expect(result).not.toContain('(');
            expect(result).not.toContain(')');
        });

        it('should handle filenames with hyphens and dots correctly', () => {
            const originalName = 'my-document.v2.txt';

            const result = s3Service.generateS3Key(originalName);

            expect(result).toContain('my-document.v2.txt');
            expect(result).toMatch(/^documents\/\d+-[a-z0-9]+-my-document\.v2\.txt$/);
        });
    });
});
