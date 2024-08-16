import { DocumentType } from "src/common/types/document-type.enum";

export const DocumentTypeMap: {
    [key in DocumentType]: string;
} = {
    [DocumentType.DNI]: 'DNI',
    [DocumentType.PASAPORTE]: 'Pasaporte',
    [DocumentType.CARNET_EXTRANJERIA]: 'Carnet de extranjería',
};