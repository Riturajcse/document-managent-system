import { JsonController, Post, Get, Delete, Param, Req } from 'routing-controllers';
import { Service } from 'typedi';
import { DocumentService } from '../services';
import { UploadDocumentResponse, GetDocumentContentResponse } from '../models';
import { BaseConfig } from '../config/base.config';
import { Request } from 'express';

@Service()
@JsonController('/document')
export class DocumentController {
    constructor(private documentService: DocumentService) {}

    @Post('/upload')
    public async uploadDocument(
        @Req() request: Request
    ): Promise<UploadDocumentResponse> {
        const file = (request as any).file as Express.Multer.File;
        
        if (!file) {
            throw new Error('No file uploaded');
        }

        console.log('File uploaded:', { 
            originalname: file.originalname, 
            filename: file.filename,
            path: file.path,
            size: file.size,
            storageType: BaseConfig.STORAGE_TYPE
        });

        let document;
        
        // Check storage configuration
        if (BaseConfig.isS3Storage()) {
            // Store file in AWS S3
            document = await this.documentService.createDocument(
                file.originalname,
                undefined,
                file.buffer
            );
        } else if (BaseConfig.isMongoDBStorage()) {
            // Store file as buffer in MongoDB
            document = await this.documentService.createDocument(
                file.originalname,
                undefined,
                file.buffer
            );
        } else {
            // Store file path for filesystem storage
            document = await this.documentService.createDocument(
                file.originalname,
                file.path
            );
        }

        return new UploadDocumentResponse(document);
    }

    @Get('/list')
    public async listDocuments(): Promise<any[]> {
        const documents = await this.documentService.getAllDocuments();
        return documents.map(doc => ({
            id: doc.id.toString(),
            name: doc.name,
            path: doc.path,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }));
    }

    @Get('/content/:id')
    public async getDocumentContent(
        @Param('id') id: string
    ): Promise<GetDocumentContentResponse> {
        const { document, content } = await this.documentService.getDocumentContent(id);
        return new GetDocumentContentResponse(document, content);
    }

    @Delete('/:id')
    public async deleteDocument(
        @Param('id') id: string
    ): Promise<{ success: boolean; message: string }> {
        await this.documentService.deleteDocument(id);
        return { 
            success: true, 
            message: 'Document deleted successfully' 
        };
    }

    @Get('/health')
    public async health(): Promise<{ status: string }> {
        return { status: 'ok' };
    }
}
