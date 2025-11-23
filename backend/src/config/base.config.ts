export class BaseConfig {
    // Storage configuration
    public static readonly STORAGE_TYPE: 'filesystem' | 'mongodb' | 's3' = 
        (process.env.STORAGE_TYPE as 'filesystem' | 'mongodb' | 's3') || 'filesystem';
    
    // MongoDB configuration
    public static readonly MONGO_URI: string = 
        process.env.MONGO_URI || 'mongodb://localhost:27017/ekline';
    
    // File upload configuration
    public static readonly UPLOAD_DIR: string = 
        process.env.UPLOAD_DIR || './uploads';
    
    // Port configuration
    public static readonly PORT: number = 
        parseInt(process.env.PORT || '3000', 10);
    
    // Environment
    public static readonly NODE_ENV: string = 
        process.env.NODE_ENV || 'development';
    
    // Helper method to check if storage is MongoDB
    public static isMongoDBStorage(): boolean {
        return this.STORAGE_TYPE === 'mongodb';
    }
    
    // Helper method to check if storage is filesystem
    public static isFileSystemStorage(): boolean {
        return this.STORAGE_TYPE === 'filesystem';
    }
    
    // AWS S3 configuration
    public static readonly AWS_REGION: string = 
        process.env.AWS_REGION || 'us-east-1';
    
    public static readonly AWS_ACCESS_KEY_ID: string = 
        process.env.AWS_ACCESS_KEY_ID || '';
    
    public static readonly AWS_SECRET_ACCESS_KEY: string = 
        process.env.AWS_SECRET_ACCESS_KEY || '';
    
    public static readonly S3_BUCKET_NAME: string = 
        process.env.S3_BUCKET_NAME || '';
    
    // Helper method to check if storage is S3
    public static isS3Storage(): boolean {
        return this.STORAGE_TYPE === 's3';
    }
}
