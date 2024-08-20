import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSemesterDto {
    @ApiProperty({
        description: 'The name of the semester',
        example: '2024-I'
    })
    @IsString()
    @IsNotEmpty()
    name: string;
}
