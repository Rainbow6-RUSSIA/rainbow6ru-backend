import * as Canvas from 'canvas';
import { writeFile } from 'fs';

Canvas.registerFont(__dirname + '/../../assets/BebasNeue Bold.otf', { family: 'BebasNeue Bold' });

export async function createLobbyPreview(n: number, m: number, k: number = 0) {
    if (!(Number.isInteger(n) && Number.isInteger(m) && Number.isInteger(k))) { return; }
    const preview = Canvas.createCanvas(650, 650);
    const ctx = preview.getContext('2d');
    const images = await Promise.all([Canvas.loadImage(__dirname + `/../../assets/ranks/${n/* Math.min(...lobby.members.map((m) => m.rank)) */}.png`), Canvas.loadImage(__dirname + `/../../assets/ranks/${m/* Math.max(...lobby.members.map((m) => m.rank)) */}.png`)]);
    ctx.font = '200px "BebasNeue Bold"';
    // ctx.fillStyle = 'red';
    // ctx.fillRect(0, 0, preview.width, preview.height);
    if (k > 0) {
        ctx.fillStyle = 'white';
        ctx.fillText(`+${k}`, 20, 160);
    }
    ctx.shadowOffsetX = -25;
    ctx.shadowOffsetY = 20;
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 10;
    ctx.drawImage(images[0], -50, 150);
    ctx.drawImage(images[1], 200, 0);
    return preview.toBuffer();
    // writeFile(__dirname + `/../../assets/test.png`, preview.toBuffer(), console.log);
}
