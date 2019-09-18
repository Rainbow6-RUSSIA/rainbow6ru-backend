import * as Canvas from 'canvas';
import { writeFile } from 'fs';

Canvas.registerFont(__dirname + '/../../assets/BebasNeue Bold.otf', { family: 'BebasNeue Bold' });

export async function createLobbyPreview(n: number, m: number, k: number = 0) {
    if (!(Number.isInteger(n) && Number.isInteger(m) && Number.isInteger(k))) { return; }

    [n, m] = extractBorders([n, m]);

    const preview = Canvas.createCanvas(160, 160);
    const ctx = preview.getContext('2d');
    const images = await Promise.all([Canvas.loadImage(__dirname + `/../../assets/ranks/${n}.png`), Canvas.loadImage(__dirname + `/../../assets/ranks/${m}.png`)]);
    ctx.font = '50px "BebasNeue Bold"';
    if (k > 0) {
        ctx.fillStyle = 'white';
        ctx.fillText(`+${k}`, 5, 40);
    }
    ctx.shadowOffsetX = -7;
    ctx.shadowOffsetY = 7;
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 2.5;
    ctx.drawImage(images[0], -12, 37);
    ctx.drawImage(images[1], 50, 0);
    // writeFile(__dirname + `/../../assets/test.png`, preview.toBuffer(), console.log);
    return preview.toBuffer();
}

// createLobbyPreview(18, 20, 4);
export function extractBorders([n, m]) {
    if (n === m) {
        if (n === 0) {
            return [0, 23];
        } else {
            switch (true) {
                case n > 0 && n <= 5: return [1, 5];
                case n > 5 && n <= 10: return [6, 10];
                case n > 10 && n <= 15: return [11, 15];
                case n > 15 && n <= 19: return [16, 19];
                case n > 19: return [20, 23];
            }
        }
    } else {
        return [n, m];
    }
}
