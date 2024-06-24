import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export enum DocumentType {
    DNI = 'dni',
    PASAPORTE = 'pasaporte',
    CARNET_EXTRANJERIA = 'carnet_extranjeria',
}

@CosmosPartitionKey('id')
export class Professor {
    id?: string;
    name: string;
    email: string;
    documentType: DocumentType;
    documentNumber: string;
    schoolId: string;
    @CosmosDateTime() createdAt: Date;
}
