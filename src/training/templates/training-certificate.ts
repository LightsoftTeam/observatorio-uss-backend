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
    emisionDate: string;
    trainingFromDate: string;
    trainingToDate: string;
    duration: number;
    certificateBackgroundUrl?: string;
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
        certificateBackgroundUrl = DEFAULT_CERTIFICATE_BACKGROUND_URL
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
                    background-image: url('${certificateBackgroundUrl}');
                    background-size: cover;
                    background-repeat: no-repeat;
                    background-position: center;
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                }

                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: rgba(255, 255, 255, 0.9); /* Opcional: para hacer el texto más legible */
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
                        <p class="firma">BIG FAAC TEPPERSON GALAR SALAZAR</p>
                        <p>DIRECTOR DE DESARROLLO ACADÉMICO</p>
                    </div>
                </div>
            </body>
            </html>
    `;
}

async function getImageAsBase64(url: string) {
    try {
        // Realizar la solicitud GET a la URL
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        
        // Convertir el buffer de datos a Base64
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        
        // Determinar el tipo de imagen a partir de los headers
        const mimeType = response.headers['content-type'];
        
        // Formatear el resultado para su uso en HTML/CSS
        const base64ImageFormatted = `data:${mimeType};base64,${base64Image}`;
        
        console.log(base64ImageFormatted); // Aquí tienes la imagen en formato Base64
        return base64ImageFormatted;
    } catch (error) {
        console.error('Error al obtener la imagen:', error);
    }
}