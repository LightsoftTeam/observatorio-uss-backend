import { ApiProperty } from "@nestjs/swagger";
import { ERRORS, ERROR_CODES } from '../services/participants.service';

export class CompleteTrainingBadRequestDto {
    @ApiProperty({
        description: 'The error code.',
        example: ERROR_CODES.TRAINING_NOT_HAVE_EXECUTIONS,
        enum: ERROR_CODES,
    })
    code: ERROR_CODES;
    @ApiProperty({
        description: 'The error message.',
        example: ERRORS[ERROR_CODES.TRAINING_NOT_HAVE_EXECUTIONS],
    })
    message: string;
}