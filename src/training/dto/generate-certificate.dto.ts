import { IsEnum } from "class-validator";
import { TrainingRole } from "../entities/training.entity";

export class GenerateCertificateDto {
    @IsEnum(TrainingRole)
    role?: TrainingRole;
}