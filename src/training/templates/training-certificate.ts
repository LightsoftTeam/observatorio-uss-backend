import { FormatDate } from "src/common/helpers/format-date.helper";
import { TrainingRole } from "../entities/training.entity";
import { TrainingRoleMap } from "../mappers/training-role-map";

export interface TrainingCertificateTemplateData {
    id: string;
    name: string;
    role: TrainingRole;
    trainingName: string;
    emisionDate: string;
    trainingFromDate: string;
    trainingToDate: string;
    duration: number;
}

export function getTrainingCertificateTemplate(data: TrainingCertificateTemplateData) {
    let {  
        id,
        name,
        role,
        trainingName,
        emisionDate,
        trainingFromDate,
        trainingToDate,
        duration,
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
                    }

                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
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
                        <p>Por haber participado en calidad de ${TrainingRoleMap[role]} en el curso:</p>
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