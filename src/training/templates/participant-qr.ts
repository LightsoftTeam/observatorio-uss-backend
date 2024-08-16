import { DocumentTypeMap } from "src/professors/mappers/document-type.mapper";
import { TrainingRole } from "../entities/training.entity";
import { MARCELIS_PRO_FONT } from "./marselis-pro";
import { TrainingRoleMap } from "../mappers/training-role-map";

export interface TrainingParticipantQrTemplateData {
    participantId: string;
    roles: TrainingRole[];
    name: string;
    email: string;
    documentType: string;
    documentNumber: string;
}
export function getParticipantQrTemplate({
    participantId,
    roles,
    name,
    email,
    documentType,
    documentNumber,
}: TrainingParticipantQrTemplateData) {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
            @font-face {
                  font-family: 'MarselisPro';
                  src: url(data:font/truetype;charset=utf-8;base64,${MARCELIS_PRO_FONT}) format('truetype');
              }
            </style>
        </head>
        <body>
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                background-color: red;
            ">
                <div id="content" style="
                    min-height: 400px;
                    padding: 0.5rem;
                    background-color: black;
                    font-family: 'MarselisPro', sans-serif;
                ">
                    <div style="
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;
                        padding: 0.5rem;
                        align-items: center;
                        border: 2px solid white;
                        border-radius: 0.25rem;
                        background-color: black;
                    ">
                        <div style="
                            background-color: white;
                            color: black;
                            border-radius: 0.25rem;
                            display: inline-block;
                            padding: 4px 8px;
                            line-height: 1;
                        ">
                            <p style="
                                font-size: 11px;
                                font-weight: 500;
                                margin: 0;
                                padding: 0;
                            ">
                                ${roles.map((role) => TrainingRoleMap[role]).join(', ')}
                            </p>
                        </div>
                        <h2 style="
                            font-size: 1.25rem;
                            line-height: 1.75rem;
                            font-weight: 500;
                        "> ${name} </h2>
                        <h2 style="
                            font-size: 1rem;
                            line-height: 1.5rem;
                            font-weight: 500;
                        "> ${email} </h2>
                        <h2 style="
                            font-size: 0.875rem;
                            line-height: 1.25rem;
                            font-weight: 500;
                        "> ${DocumentTypeMap[documentType]}: ${documentNumber} </h2>
                        <img
                            src='https://quickchart.io/qr?text=${participantId}&size=600'
                            style="padding: 0.75rem;"
                            crossOrigin="anonymous"
                        />
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}