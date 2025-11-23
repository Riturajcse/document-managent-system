import { IsString, IsDate } from 'class-validator';
import { Document } from '../entity/Document';

export class UploadDocumentResponse {
    @IsString()
    message: string;

    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsString()
    path?: string;

    @IsDate()
    createdAt: Date;

    @IsDate()
    updatedAt: Date;

    constructor(document: Document) {
        this.message = 'File uploaded successfully';
        this.id = document.id.toString();
        this.name = document.name;
        this.path = document.path || undefined;
        this.createdAt = document.createdAt;
        this.updatedAt = document.updatedAt;
    }
}
