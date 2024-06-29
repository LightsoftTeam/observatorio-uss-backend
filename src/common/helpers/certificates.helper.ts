import { TrainingCertificate } from "src/training/entities/training.entity";

export class CertificatesHelper {
    static getBlobName(certificateId: string) {
        return `certificates/${certificateId}.pdf`;
    }

    //*
    // * @param certificate
    // * @returns string
    // * @description Get the filename for the certificate with a format understandable by the user
    // */
    static getUserFilename(certificate: TrainingCertificate) {
        return `${certificate.name}.pdf`;
    }
}