import { FormatDate } from "src/common/helpers/format-date.helper";
import { DateTime } from 'luxon';
import { TrainingRole } from "../entities/training.entity";
import { TrainingRoleMap } from "../mappers/training-role-map";

const MONTH_NAMES = [
    '-',
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'setiembre',
    'octubre',
    'noviembre',
    'diciembre'
];

//TODO: Change the default certificate background URL to the correct one in oficial server
const DEFAULT_CERTIFICATE_BACKGROUND_URL = 'https://lightsoft.blob.core.windows.net/lightsoft/observatorio-uss%2F1722569940652_fondo_certificado_uss_default.png?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2099-03-03T13:12:01Z&st=2024-03-03T05:12:01Z&spr=https,http&sig=%2BfzCUZcEebdMsuMC3NDjtrpAoFCoB9I1QbITCfpvmcg%3D';
const DEFAULT_SIGNATURE_URL = 'https://cdn.shopify.com/s/files/1/0594/4639/5086/files/underline_b49eefdc-d72c-4e68-84a4-dcbd1404a772.jpg';

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
        name,
        emisionDate,
        backgroundUrl = DEFAULT_CERTIFICATE_BACKGROUND_URL,
        signatureUrl = DEFAULT_SIGNATURE_URL,
    } = data;
    emisionDate = FormatDate.toHuman(emisionDate);

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
                    padding: 420px 170px;
                }

                .innerContainer .content .body {
                    margin-top: 40px;
                    font-size: 16px;
                    text-align: justify;
                }

                .innerContainer .content .name{
                    display: flex;
                    justify-content: center;
                }
               
                .innerContainer .content .name p{
                    font-size: 30px;
                    font-weight: bold;
                }

                .innerContainer .emisionDate{
                    display: flex;
                    justify-content: flex-end;
                    font-size: 16px;
                }

                .innerContainer .signature {
                    display: flex;
                    justify-content: center;
                    margin-top: 40px;
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
            </style>
            </head>
            <body>
                <div class="container">
                    <div class="background">
                        <img src="${backgroundUrl}" alt="Logo USS" class="logo">
                    </div>
                    <div class="innerContainer">
                        <div class="content">
                            <div class="name"><p>${name.toUpperCase()}</p></div>
                            <p class="body">${getCertificateBody(data)}</p>
                        </div>
                        <div class="emisionDate">
                                <p>Pimentel, ${emisionDate}</p>
                        </div>
                        <div class="signature">
                            <img width="200px" src="${signatureUrl}">
                        </div>
                    </div>
                </div>
            </body>
            </html>
    `;
}

function getCertificateBody(data: TrainingCertificateTemplateData) {
    const { roles, trainingName, trainingFromDate, trainingToDate, duration } = data;

    //use luxon
    const fromDateInPeru = DateTime.fromISO(trainingFromDate, { zone: 'utc' }).setZone('America/Lima');
    const toDateInPeru = DateTime.fromISO(trainingToDate, { zone: 'utc' }).setZone('America/Lima');

    let dateRangeLabel = ``;

    if(fromDateInPeru.year === toDateInPeru.year){ 
        if(fromDateInPeru.month === toDateInPeru.month){
            dateRangeLabel = `${fromDateInPeru.day} al ${toDateInPeru.day} de ${MONTH_NAMES[toDateInPeru.month]} de ${toDateInPeru.year}`
        } else {
            dateRangeLabel = `${fromDateInPeru.day} de ${MONTH_NAMES[fromDateInPeru.month]} al ${toDateInPeru.day} de ${MONTH_NAMES[toDateInPeru.month]} de ${toDateInPeru.year}`
        }
    } else {
        dateRangeLabel = `${fromDateInPeru.day} de ${MONTH_NAMES[fromDateInPeru.month]} de ${fromDateInPeru.year} al ${toDateInPeru.day} de ${MONTH_NAMES[toDateInPeru.month]} de ${toDateInPeru.year}`
    }

    return `Por haber participado en calidad de ${roles.map(r => TrainingRoleMap[r].toUpperCase()).join(', ')} en la capacitación docente "${trainingName}" organizada por el Vicerrectorado Académico de la Universidad Señor de Sipán, en coordinación con la Dirección de Desarrollo Académico, realizada del ${dateRangeLabel}, con una duración de ${duration} horas académicas.`;
}