import { FormatDate } from "src/common/helpers/format-date.helper";
import { TrainingRole } from "../entities/training.entity";
import { TrainingRoleMap } from "../mappers/training-role-map";
import axios from "axios";

//TODO: Change the default certificate background URL to the correct one in oficial server
const DEFAULT_CERTIFICATE_BACKGROUND_URL = 'https://lightsoft.blob.core.windows.net/lightsoft/observatorio-uss%2F1722569940652_fondo_certificado_uss_default.png?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2099-03-03T13:12:01Z&st=2024-03-03T05:12:01Z&spr=https,http&sig=%2BfzCUZcEebdMsuMC3NDjtrpAoFCoB9I1QbITCfpvmcg%3D';

export interface TrainingCertificateTemplateData {
    participantId: string;
    name: string;
    roles: TrainingRole[];
    trainingName: string;
    trainingFromDate: string;
    trainingToDate: string;
    duration: number;
    emisionDate: string;
    backgroundUrl?: string;
    signatureUrl?: string;
}

export function getTrainingCertificateTemplate(data: TrainingCertificateTemplateData) {
    let {
        participantId,
        name,
        roles,
        trainingName,
        emisionDate,
        trainingFromDate,
        trainingToDate,
        duration,
        backgroundUrl = DEFAULT_CERTIFICATE_BACKGROUND_URL,
        signatureUrl
    } = data;
    emisionDate = FormatDate.toHuman(emisionDate);
    trainingFromDate = FormatDate.toHuman(trainingFromDate);
    trainingToDate = FormatDate.toHuman(trainingToDate);

    return `
        <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Constancia de participación</title>
                <style>
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100vh;
                    box-sizing: border-box;
                }

                .container {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                .innerContainer{
                    position: absolute;
                    top: 0;
                    left: 0;
                    padding: 20px;
                }

                .background{
                    width: 100%;
                    height: 100%;
                }

                .background img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }

                .logo {
                    width: 100px;
                    height: auto;
                }

                .title {
                    font-size: 24px;
                    font-weight: bold;
                }

                .content {
                    margin-bottom: 20px;
                }

                .data {
                    font-style: italic;
                }

                .table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .table th,
                .table td {
                    border: 1px solid #ccc;
                    padding: 5px;
                }

                .table th {
                    text-align: left;
                    background-color: #eee;
                }

                .signature {
                    text-align: center;
                    margin-top: 20px;
                }

                .firma {
                    font-size: 16px;
                    font-weight: bold;
                }
            </style>
            </head>
            <body>
                <div class="container">
                    <div class="background">
                        <img src="${backgroundUrl}" alt="Logo USS" class="logo">
                    </div>
                    <div class="innerContainer">
                        <div class="header">
                            <img src="https://observatorio.uss.edu.pe/_next/image?url=%2Fimg%2Flogo_gray.png&w=256&q=75" alt="Logo USS" class="logo">
                            <h1 class="title">Universidad Señor de Sipán</h1>
                        </div>

                        <div class="content">
                            <p>La Universidad Señor de Sipan, a través de la Dirección de Desarrollo Académico otorga la presente</p>
                            <h2>CONSTANCIA</h2>
                            <p>A:</p>
                            <p><strong>${name.toUpperCase()}</strong></p>
                            <p>Por haber participado en calidad de ${roles.map(r => TrainingRoleMap[r]).join(', ')} en el curso:</p>
                            <p><strong>${trainingName.toUpperCase()}</strong></p>
                            <p class="data">Organizado por la Universidad Señor de Sipán, a través de la Dirección de Desarrollo Académico, en coordinación con la Dirección de Gestión de Talento Humano, que se desarrolló del ${trainingFromDate} al ${trainingToDate}, con una duración total de ${duration} horas académicas.</p>
                        </div>

                        <table class="table">
                            <tr>
                                <th>FECHA DE LA CAPACITACIÓN</th>
                                <td>Pimentel, ${trainingFromDate}</td>
                            </tr>
                            <tr>
                                <th>FECHA DE EMISIÓN</th>
                                <td>Pimentel, ${emisionDate}</td>
                            </tr>
                        </table>

                        <div class="signature">
                            <img width="200px" src="${signatureUrl}">
                        </div>
                    </div>
                </div>
            </body>
            </html>
    `;
}