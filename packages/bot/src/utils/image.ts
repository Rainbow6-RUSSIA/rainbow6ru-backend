import * as Canvas from 'canvas';
import { writeFile } from 'fs';

Canvas.registerFont(__dirname + '/../../assets/BebasNeue Bold.otf', { family: 'BebasNeue Bold' });

export async function createLobbyPreview(n: number, m: number, k: number = 0) {
    if (!(Number.isInteger(n) && Number.isInteger(m) && Number.isInteger(k))) { return; }
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
