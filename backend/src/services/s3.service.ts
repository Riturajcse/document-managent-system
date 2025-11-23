import { Service } from 'typedi';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { BaseConfig } from '../config/base.config';
import { Readable } from 'stream';

@Service()
export class S3Service {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.bucketName = BaseConfig.S3_BUCKET_NAME;
        
        this.s3Client = new S3Client({
            region: BaseConfig.AWS_REGION,
            credentials: {
                accessKeyId: BaseConfig.AWS_ACCESS_KEY_ID,
                secretAccessKey: BaseConfig.AWS_SECRET_ACCESS_KEY,
            },
        });
    }

    /**
     * Upload a file to S3
     * @param key The S3 object key (file path in S3)
     * @param body The file content as Buffer
     * @param contentType The MIME type of the file
     * @returns The S3 object key
     */
    public async uploadFile(key: string, body: Buffer, contentType?: string): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: body,
                ContentType: contentType,
            });

            await this.s3Client.send(command);
            console.log(`File uploaded to S3: ${key}`);
            
            return key;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to upload file to S3: ${errorMessage}`);
        }
    }

    /**
     * Download a file from S3
     * @param key The S3 object key (file path in S3)
     * @returns The file content as string
     */
    public async downloadFile(key: string): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);
            
            if (!response.Body) {
                throw new Error('No content in S3 response');
            }

            // Convert the stream to string
            const stream = response.Body as Readable;
            const chunks: Buffer[] = [];
            
            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                stream.on('error', (err) => reject(err));
                stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to download file from S3: ${errorMessage}`);
        }
    }

    /**
     * Delete a file from S3
     * @param key The S3 object key (file path in S3)
     */
    public async deleteFile(key: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
            console.log(`File deleted from S3: ${key}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to delete file from S3: ${errorMessage}`);
        }
    }

    /**
     * Generate a unique S3 key for a file
     * @param originalName The original filename
     * @returns A unique S3 key
     */
    public generateS3Key(originalName: string): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `documents/${timestamp}-${randomString}-${sanitizedName}`;
    }
}
