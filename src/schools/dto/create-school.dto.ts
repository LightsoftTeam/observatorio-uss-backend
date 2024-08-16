import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSchoolDto {
    @ApiProperty({
        description: 'The name of the school',
        example: 'Ingeniería de Sistemas',
    })
    @IsString()
    @IsNotEmpty()
    name: string;
}
