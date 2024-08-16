import { TrainingCertificate } from "src/training/entities/training.entity";

export class CertificatesHelper {
    static getBlobName(certificateId: string) {
        const masterFolder = process.env.AZURE_STORAGE_FOLDER || null;
        const folder = masterFolder ? `${masterFolder}/certificates` : 'certificates';
        return `${folder}/${certificateId}.pdf`;
    }

    //*
    // * @param certificate
    // * @returns string
    // * @description Get the filename for the certificate with a format understandable by the user
    // */
    static getUserFilename(certificate: TrainingCertificate) {
        const { name, role } = certificate;
        return `${name}-${role}.pdf`;
    }
}