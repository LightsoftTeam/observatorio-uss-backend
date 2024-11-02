import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateAppConfigurationDto {
    @ApiProperty({
        description: 'The value',
        example: 'This is the value',
    })
    @IsString()
    @IsNotEmpty()
    value: string;
}
