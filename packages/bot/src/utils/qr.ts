
import { UUID } from '@r6ru/types';
import { AwesomeQRCode, QRErrorCorrectLevel } from 'awesome-qr';
import { createHash } from 'crypto';
import readerQR from 'jsqr';
import fetch from 'node-fetch';
import { PNG } from 'pngjs';
import ENV from './env';

const png = new PNG();

export function generate(genome: UUID, id: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        new AwesomeQRCode().create({
            autoColor: false,
            backgroundDimming: 'rgba(0,0,0,0)',
            backgroundImage: __dirname + '/../../assets/r6rus.png',
            borderDark : 'rgba(0, 0, 0, .1)',
            borderLight : 'rgba(255, 255, 255, .1)',
            callback: (data) => data ? resolve(data) : reject(new Error('QR No Data')),
            colorDark: 'rgba(0, 0, 0, 0.8)',
            colorLight: 'rgba(255, 255, 255, 1)',
            correctLevel: QRErrorCorrectLevel.H,
            dotScale: 0.6,
            drawPosition : false,
            logoCornerRadius: 8,
            margin: 5,
            size: 500,
            text: `${id}${createHash('md5').update(`${genome}_${id}_${ENV.KEY256}`).digest('base64')}`,
            typeNumber: 4,
            whiteMargin: true,
        });
    });
}

export async function verify(genome: UUID, id: string): Promise<boolean> {
    const res = await fetch(`https://ubisoft-avatars.akamaized.net/${genome}/default_256_256.png`);
    const buff = await res.buffer();
    const img = PNG.sync.read(buff);
    // const img = await new Promise<PNG>((resolve, reject) => png.parse(buff, (err, data) => err ? reject(err) : resolve(data)));
    const code = readerQR(Uint8ClampedArray.from(img.data), img.width, img.height);
    if (code) {
        const args = [code.data.slice(0, 18), code.data.slice(18)];
        return createHash('md5').update(`${genome}_${args[0]}_${ENV.KEY256}`).digest('base64') === args[1] && args[0] === id;
    } else {
        throw new Error('QR No Data');
    }
}
