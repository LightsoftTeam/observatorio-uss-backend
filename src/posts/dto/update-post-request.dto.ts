
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { ApprovalStatus } from "../entities/post.entity";

export class UpdatePostRequestDto {
    @ApiProperty({
        description: 'The action to be performed on the post',
        example: ApprovalStatus.APPROVED,
        enum: ApprovalStatus,
    })
    @IsEnum(ApprovalStatus)
    approvalStatus: ApprovalStatus;
}