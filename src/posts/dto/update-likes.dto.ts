import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { LikeAction } from "../types/like-action.type";

export class UpdateLikesDto {
    @ApiProperty({
        description: 'The action to perform on the post likes',
        example: LikeAction.DECREMENT,
        default: LikeAction.INCREMENT,
        enum: LikeAction,
    })
    @IsString()
    @IsOptional()
    action: LikeAction;
}
