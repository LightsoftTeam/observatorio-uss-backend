import { ApiProperty } from "@nestjs/swagger";
import { ERRORS, ERROR_CODES } from '../services/participants.service';

export class DownloadQrBadRequestDto {
    @ApiProperty({
        description: 'The error code.',
        example: ERROR_CODES.PARTICIPANT_NOT_FOUND
    })
    code: ERROR_CODES.PARTICIPANT_NOT_FOUND;
    @ApiProperty({
        description: 'The error message.',
        example: ERRORS[ERROR_CODES.PARTICIPANT_NOT_FOUND].message,
    })
    message: string;
}