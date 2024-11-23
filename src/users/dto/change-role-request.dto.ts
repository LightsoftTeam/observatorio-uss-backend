import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export enum Action{
    ACCEPT = 'accept',
    REJECT = 'reject',
}

export class ChangeRoleRequestDto {
    @ApiProperty({
        description: 'The action to be taken on the role request',
        example: Action.ACCEPT,
        enum: Action
    })
    @IsEnum(Action)
    action: Action;
}