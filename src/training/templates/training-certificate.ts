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
    certificateOrganizer?: string;
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
                    overflow: hidden;
                }
                
                .container img {
                    width: 100%;
                    height: 100%;
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
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .innerContainer .content .name p{
                    font-size: 24px;
                    font-weight: semibold;
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

                .innerContainer .signature img {
                    width: 200px;
                    height: 100px;
                }
            </style>
            </head>
            <body>
                <div class="container">
                    <img src="${backgroundUrl}" alt="Logo USS" class="logo">

                    <div class="innerContainer">
                        <div class="content">
                            <div class="name"><p>${name.toUpperCase()}</p></div>
                            <p class="body">${getCertificateBody(data)}</p>
                        </div>
                        <div class="emisionDate">
                                <p>Pimentel, ${emisionDate}</p>
                        </div>
                        <div class="signature">
                            <img src="${signatureUrl}">
                        </div>
                    </div>
                </div>
            </body>
            </html>
    `;
}

function getCertificateBody(data: TrainingCertificateTemplateData) {
    const { roles, trainingName, trainingFromDate, trainingToDate, duration, certificateOrganizer = 'Vicerrectorado Académico de la Universidad Señor de Sipán' } = data;

    const dateRangeLabel = getDateRangeLabel({ from: trainingFromDate, to: trainingToDate });

    const roundedDuration = Math.round(duration);

    return `Por haber participado en calidad de ${roles.map(r => TrainingRoleMap[r].toUpperCase()).join(', ')} en la capacitación docente "${trainingName}" organizada por el ${certificateOrganizer}, en coordinación con la Dirección de Desarrollo Académico, realizada del ${dateRangeLabel}, con una duración de ${roundedDuration} horas académicas.`;
}

function getDateRangeLabel({from: trainingFromDate, to: trainingToDate}){

    const from = DateTime.fromISO(trainingFromDate, { zone: 'utc' }).setZone('America/Lima');
    const to = DateTime.fromISO(trainingToDate, { zone: 'utc' }).setZone('America/Lima');

    let dateRangeLabel = ``;

    const fromDay = from.day;
    const fromMonth = MONTH_NAMES[from.month];
    const fromYear = from.year;

    const toDay = to.day;
    const toMonth = MONTH_NAMES[to.month];
    const toYear = to.year;

    if (fromYear === toYear) {
        if (fromMonth === toMonth) {
            if (fromDay === toDay) {
                dateRangeLabel = `${fromDay} de ${fromMonth} de ${fromYear}`;
            } else {
                dateRangeLabel = `${fromDay} al ${toDay} de ${toMonth} de ${toYear}`;
            }
        } else {
            dateRangeLabel = `${fromDay} de ${fromMonth} al ${toDay} de ${toMonth} de ${toYear}`;
        }
    } else {
        dateRangeLabel = `${fromDay} de ${fromMonth} de ${fromYear} al ${toDay} de ${toMonth} de ${toYear}`;
    }
    return dateRangeLabel;
}