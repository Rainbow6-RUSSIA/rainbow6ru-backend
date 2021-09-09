import { User } from 'discord.js';
import fetch from 'node-fetch'
import * as restify from 'restify';
import { registerFont, createCanvas, Canvas, Image, ImageData, loadImage } from 'canvas';
import * as GIFEncoder from 'gifencoder';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { RankGaps } from '@r6ru/types';

registerFont(__dirname + '/../../assets/BebasNeue Bold.otf', { family: 'BebasNeue Bold' });

export async function createLobbyPreview(n: number, m: number, k: number = 0) {
    [n, m] = extractBorders([n, m]);

    const preview = createCanvas(160, 160);
    const ctx = preview.getContext('2d');
    const images = await Promise.all([loadImage(__dirname + `/../../assets/ranks/${n}.png`), loadImage(__dirname + `/../../assets/ranks/${m}.png`)]);
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

const rainbow = createCanvas(160, 160);
const rainbowCtx = rainbow.getContext('2d');

const CX = rainbow.width / 2,
    CY = rainbow.height / 2,
    sx = CX,
    sy = CY,
    da = 20;

for (let i = 0; i < 360; i += da) {
    const angle1 = i * (2 * Math.PI) / 360;
    const angle2 = (i + da) * (2 * Math.PI) / 360;
    rainbowCtx.fillStyle = "hsla(" + i + ", 100%, 50%, 1.0)";
    rainbowCtx.beginPath();
    rainbowCtx.moveTo(CX, CY);
    rainbowCtx.lineTo(CX + sx * Math.cos(angle1), CY + sy * Math.sin(angle1));
    rainbowCtx.lineTo(CX + sx * Math.cos(angle2), CY + sy * Math.sin(angle2));
    rainbowCtx.fill();
}

export async function createEnhancedUserPreview(user: User, res: restify.Response) {
    let getFrame: (i: number) => Canvas | Image = null
    let numOfFrames = 30;
    let delay = 100;
    const border = 3;

    const coverCanvas = createCanvas(128, 128);
    const coverCtx = coverCanvas.getContext('2d');

    if (user.avatar.startsWith('a_')) {
        const bufferPromise = fetch(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif?size=128`)
            .then(d => d.buffer());
        const framesData = await bufferPromise
            .then(parseGIF)
            .then(gif => decompressFrames(gif, true));

        const { width, height } = framesData[0].dims;

        const tmpCanvas = createCanvas(width, height);
        const tmpCtx = tmpCanvas.getContext('2d');
        getFrame = (i: number) => {
            if (framesData[i]) {
                tmpCtx.putImageData(new ImageData(framesData[i].patch, width, height), 0, 0);
                coverCtx.drawImage(tmpCanvas, 0, 0, 128, 128);
            }
            return coverCanvas;
        }
        numOfFrames = framesData.length;
        delay = framesData[0].delay;
    } else {
        const avatar = await fetch(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`).then(d => d.buffer());
        const canvasPage = await loadImage(avatar, { width: 80, height: 80 })
        getFrame = () => canvasPage;
    }

    const encoder = new GIFEncoder(80, 80);
    encoder.createReadStream().pipe(res).on('error', (err: Error) => { throw err });

    encoder.start();
    // encoder.setTransparent(0x000000); // make black transparent
    encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
    encoder.setDelay(delay); // frame delay in ms
    encoder.setQuality(10); // image quality. 10 is default.

    const preview = createCanvas(80, 80);
    const ctx = preview.getContext('2d');

    const { width, height } = preview

    ctx.translate(width / 2, height / 2);

    for (let i = 0; i < numOfFrames; i++) {
        const angle = 2 * Math.PI / numOfFrames;
        ctx.rotate(angle * i);
        ctx.drawImage(rainbow, -width, -height);
        ctx.rotate(-angle * i);

        // const page = await sharp(avatar, { pages: 1, page: i }).toBuffer()
        ctx.drawImage(getFrame(i), -width / 2 + border, -height / 2 + border, width - border * 2, height - border * 2);
        // ctx.putImageData()

        encoder.addFrame(ctx);
    }

    encoder.finish();
}

const rankedGap = 1000

export function canQueue([n, m]) {
    if (n === 0) return true
    const guaranteedLowerBorder = RankGaps[n + 1] - 1
    const guaranteedUpperBorder = RankGaps[m]
    return Math.abs(guaranteedUpperBorder - guaranteedLowerBorder) < rankedGap
}

// createLobbyPreview(18, 20, 4);
export function extractBorders([n, m]) {
    if (n === m) {
        if (n === 0) {
            return [0, 25];
        } else {
            const possibleLowerBorder = RankGaps[n]
            const possibleUpperBorder = RankGaps[n + 1] - 1
            const mmrRange = [possibleLowerBorder - rankedGap, possibleUpperBorder + rankedGap]
            return [RankGaps.slice(1).findIndex(g => g > mmrRange[0]) - 1, RankGaps.slice(1).findIndex(g => g > mmrRange[1]) - 1]
        }
    } else {
        return [n, m];
    }
}
