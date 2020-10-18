import { User } from 'discord.js';
import * as Canvas from 'canvas';
import fetch from 'node-fetch'
import * as GIFEncoder from 'gifencoder';
import * as restify from 'restify';

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

const rainbow = Canvas.createCanvas(320, 320);
const rainbowCtx = rainbow.getContext('2d');

var CX = rainbow.width / 2,
    CY = rainbow.height/ 2,
    sx = CX,
    sy = CY;

for(var i = 0; i < 360; i+=0.1){
    var rad = i * (2*Math.PI) / 360;
    rainbowCtx.strokeStyle = "hsla("+i+", 100%, 50%, 1.0)";   
    rainbowCtx.beginPath();
    rainbowCtx.moveTo(CX, CY);
    rainbowCtx.lineTo(CX + sx * Math.cos(rad), CY + sy * Math.sin(rad));
    rainbowCtx.stroke();
}

export async function createEnhancedUserPreview(user: User, res: restify.Response) {
    
    // if (user.avatar.startsWith('a_')) {
    //     const res = await fetch(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif?size=128`);
    //     res.body.pipe();

    // } else {
        // const avatar = await fetch().then(d => d.blob())
    // }
    const canvasAvatar = await Canvas.loadImage(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`, { width: 160, height: 160 })

    const FRAMES = 10;
    const BORDER = 3;

    const encoder = new GIFEncoder(160, 160);
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setTransparent(0x000000); // make black transparent
    encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
    encoder.setDelay(1000 / FRAMES); // frame delay in ms
    encoder.setQuality(10); // image quality. 10 is default.

    const preview = Canvas.createCanvas(160, 160);
    const ctx = preview.getContext('2d');

    const { width, height } = preview

    ctx.translate(width / 2, height / 2);

    for (let i = 0; i <= FRAMES; i++) {
        const angle = 2 * Math.PI / FRAMES; 
        ctx.rotate(angle * i);
        ctx.drawImage(rainbow, -width, -height);
        ctx.rotate(-angle * i);

        ctx.drawImage(canvasAvatar, -width / 2 + BORDER, -height / 2 + BORDER, width - BORDER * 2, height - BORDER * 2);

        encoder.addFrame(ctx);
    }

    encoder.finish();
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
