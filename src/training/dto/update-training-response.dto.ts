import { ApiProperty } from "@nestjs/swagger";
import { ERRORS, ERROR_CODES } from "../training.service";

export class UpdateTrainingBadRequestDto {
    @ApiProperty({
        description: 'The error code.',
        example: ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS,
        enum: ERROR_CODES,
    })
    code: ERROR_CODES;
    @ApiProperty({
        description: 'The error message.',
        example: ERRORS[ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS].message,
    })
    message: string;
}