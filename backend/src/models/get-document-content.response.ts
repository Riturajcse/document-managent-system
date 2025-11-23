import { IsString } from 'class-validator';
import { Document } from '../entity/Document';

export class GetDocumentContentResponse {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsString()
    path?: string;

    @IsString()
    content: string;

    constructor(document: Document, content: string) {
        this.id = document.id.toString();
        this.name = document.name;
        this.path = document.path || undefined;
        this.content = content;
    }
}
