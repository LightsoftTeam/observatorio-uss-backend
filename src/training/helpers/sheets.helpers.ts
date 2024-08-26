import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { sheets_v4 } from "googleapis/build/src/apis/sheets";

export async function getSheetRows<T>({ sheets, spreadsheetId, sheetName }: { sheets: sheets_v4.Sheets, spreadsheetId: string, sheetName: string }): Promise<T[]> {
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
    return trainingRows as T[];
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
    const sheets = google.sheets({ version: 'v4', auth: client });
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
    });
    const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
    return { sheets, spreadsheetId, sheetNames };
}