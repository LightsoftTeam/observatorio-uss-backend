
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApprovalStatus } from "../entities/post.entity";

export class UpdatePostRequestDto {
    @ApiProperty({
        description: 'The action to be performed on the post',
        example: ApprovalStatus.APPROVED,
        enum: ApprovalStatus,
    })
    @IsEnum(ApprovalStatus)
    approvalStatus: ApprovalStatus;
    @ApiProperty({
        description: 'The reason for rejecting the post',
        example: 'The post is not relevant',
        required: false,
    })
    @IsString()
    @IsOptional()
    rejectionReason?: string;
}