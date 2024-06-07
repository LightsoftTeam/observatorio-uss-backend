import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { TrainingModality, TrainingStatus } from "../entities/training.entity";

class ExecutionRequest {
    @ApiProperty({
        description: 'The id of the execution',
        example: 'a1b2c3d4-1234-5678-90ab-cdef12345678',
    })
    @IsString()
    @IsOptional()
    id?: string;
    @ApiProperty({
        description: 'The date of the execution',
        example: '2022-07-01',
    })
    @IsDateString()
    date: string;
}

export class CreateTrainingDto {
    @ApiProperty({
        description: 'The code of the training',
        example: '0001-2020-II',
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        description: 'The name of the training',
        example: 'Training 1',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The month of the training',
        example: 7,
    })
    month: number;

    @ApiProperty({
        description: 'The executions of the training',
        example: [{ date: '2022-07-01' }],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExecutionRequest)
    executions: ExecutionRequest[];

    @ApiProperty({
        description: 'The place of the training',
        example: 'Av. Los Pinos 123',
    })
    @IsOptional()
    place?: string;

    @ApiProperty({
        description: 'The floor of the training',
        example: 1,
    })
    @IsOptional()
    floor?: number;

    @ApiProperty({
        description: 'The building of the training',
        example: 'Building A',
    })
    @IsOptional()
    building?: string;

    @ApiProperty({
        description: 'The organizer of the training',
        example: 'DDA',
    })
    @IsString()
    @IsNotEmpty()
    organizer: 'DDA' | string;

    @ApiProperty({
        description: 'The status of the training',
        example: TrainingStatus.ACTIVE,
        enum: TrainingStatus
    })
    @IsEnum(TrainingStatus)
    status: TrainingStatus;

    @ApiProperty({
        description: 'The modality of the training',
        example: TrainingModality.PRESENTIAL,
        enum: TrainingModality
    })
    @IsEnum(TrainingModality)
    modality: TrainingModality;

    @ApiProperty({
        description: 'The end date of the training',
        example: '2022-07-01T00:00:00.000Z',
    })
    endDate: string;

    @ApiProperty({
        description: 'The capacity of the training',
        example: 100,
    })
    capacity: number;
}
