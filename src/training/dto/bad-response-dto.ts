import { ApiProperty } from "@nestjs/swagger";
import { ERROR_CODES, APP_ERRORS } from "../../common/constants/errors.constants";

export class TrainingBadRequestDto {
    @ApiProperty({
        description: 'The error code.',
        example: ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS,
        enum: ERROR_CODES,
    })
    code: ERROR_CODES;
    @ApiProperty({
        description: 'The error message.',
        example: APP_ERRORS[ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS].message,
    })
    message: string;
}