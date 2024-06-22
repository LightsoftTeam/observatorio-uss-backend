import { ApiProperty } from "@nestjs/swagger";
import { ERROR_CODES } from '../professors.service';

export class InvalidVerificationCodeErrorResponseDto {
    @ApiProperty({
        description: 'The error code.',
        example: ERROR_CODES.INVALID_CODE,
        enum: ERROR_CODES,
    })
    code: ERROR_CODES;
    @ApiProperty({
        description: 'The error message.',
        example: 'Invalid code',
    })
    message: string;
}