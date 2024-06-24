import { TrainingRole } from "../../training/entities/training.entity";
import { DocumentType } from '../entities/professor.entity';

export const DocumentTypeMap: {
    [key in DocumentType]: string;
} = {
    [DocumentType.DNI]: 'DNI',
    [DocumentType.PASAPORTE]: 'Pasaporte',
    [DocumentType.CARNET_EXTRANJERIA]: 'Carnet de extranjería',
};