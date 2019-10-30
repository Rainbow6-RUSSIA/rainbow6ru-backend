import * as dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import ENV from './env';

async function main() {
    const credentials = JSON.parse(ENV.GOOGLE_AUTH);
    const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );

    await auth.authorize();

    const sheets = google.sheets({ version: 'v4', auth });

    console.log(await sheets.spreadsheets.values.get({
        spreadsheetId: '15RP3QlsVKkIriYYyZSEiM2rmPpyrwfNqk-vdWHaUuG4',
        range: 'Лист1!A1:F10'
    }));

    await sheets.spreadsheets.values.clear({
        spreadsheetId: '15RP3QlsVKkIriYYyZSEiM2rmPpyrwfNqk-vdWHaUuG4',
        range: 'Лист1!A1:F10'
    });
}

main();
