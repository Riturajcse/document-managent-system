import { IsString } from 'class-validator';

export class GetDocumentContentRequest {
    @IsString()
    id: string;

    constructor(id: string) {
        this.id = id;
    }
}
