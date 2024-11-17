import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { sheets_v4 } from "googleapis/build/src/apis/sheets";

export async function getSheetRows<T>({ sheets, spreadsheetId, sheetName }: { sheets: sheets_v4.Sheets, spreadsheetId: string, sheetName: string }): Promise<{
    headers: string[],
    rows: T[]
}> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: sheetName,
    });
    const [headers, ...rows] = response.data.values;
    const trainingRows = rows.map(row => {
        return headers.reduce((acc, header, index) => {
            acc[header] = row[index];
            return acc;
        }, {});
    });
    return {
        headers,
        rows: trainingRows,
    };
}

export async function getFileInfo() {
    const spreadsheetId = process.env.TRAINING_MIGRATION_SPREADSHEET_ID;
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    const client = new JWT({
        email,
        key,
        scopes,
    });
    await client.authorize();
    const sheetsClient = google.sheets({ version: 'v4', auth: client });
    const spreadsheet = await sheetsClient.spreadsheets.get({
        spreadsheetId: spreadsheetId,
    });
    const sheets = spreadsheet.data.sheets;
    const sheetNames = sheets.map(sheet => sheet.properties.title);
    return { sheetsClient, spreadsheetId, sheetNames, sheets };
}

// export async function updateRawState({range, sheets, state}: {sheets: sheets_v4.Sheets, range: string, state: 'success' | 'error'}){
//     const spreadsheetId = process.env.TRAINING_MIGRATION_SPREADSHEET_ID;
//     sheets.spreadsheets.values.update({
//         spreadsheetId,
//         range,
//         valueInputOption: 'RAW',
//         requestBody: {
//             values: [[state]],
//         },
//     })
// }

export interface UpdateInBatchPayload {
    [sheetId: string]: {
        values: string[],
        rowIndex: number,
        columnIndex: number,
    }
}
export async function updateColumnInBatch({ sheetsClient, payload }: { sheetsClient: sheets_v4.Sheets, payload: UpdateInBatchPayload }) {
    const spreadsheetId = process.env.TRAINING_MIGRATION_SPREADSHEET_ID;

    const requests = Object.entries(payload).map(([sheetId, { values, rowIndex, columnIndex }]) => {
        return {
            updateCells: {
                rows: values.map(value => ({
                    values: [{ userEnteredValue: { stringValue: value } }],
                })
                ),
                fields: 'userEnteredValue',
                start: { sheetId: Number(sheetId), rowIndex, columnIndex },
            },
        };
    });

    sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
    });
}