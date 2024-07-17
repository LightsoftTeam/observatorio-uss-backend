import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { DocumentType } from "src/common/types/document-type.enum";
import { CREATE_ERRORS } from "../guests.service";

export class CreateGuestBadRequestDto {
    @ApiProperty({
        description: 'The error code',
        example: CREATE_ERRORS.INVALID_CODE_ERROR,
    })
    @IsEnum(CREATE_ERRORS)
    @IsNotEmpty()
    code: CREATE_ERRORS;

    @ApiProperty({
        description: 'The error message',
        example: 'Invalid code',
    })
    @IsString()
    message: string;
}
