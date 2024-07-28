import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateCompetencyDto {
    @ApiProperty({
        description: 'The name of the competency',
        example: 'Software Development',
    })
    @IsString()
    @IsNotEmpty()
    name: string;
}
