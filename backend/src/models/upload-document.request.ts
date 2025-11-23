import { IsNotEmpty } from 'class-validator';

export class UploadDocumentRequest {
    @IsNotEmpty()
    file: any; // Multer file object
}
