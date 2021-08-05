
import { UUID } from '@r6ru/types';
import { AwesomeQRCode, QRErrorCorrectLevel } from 'awesome-qr';
import * as Canvas from 'canvas';
import { createHash } from 'crypto';
import readerQR from 'jsqr';
import fetch from 'node-fetch';
import ENV from './env';

export function generate(genome: UUID, id: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        new AwesomeQRCode().create({
            autoColor: false,
            backgroundDimming: 'rgba(0,0,0,0)',
            backgroundImage: __dirname + '/../../assets/r6rus.png',
            borderDark : 'rgba(0, 0, 0, .1)',
            borderLight : 'rgba(255, 255, 255, .1)',
            callback: data => data ? resolve(data) : reject(new Error('QR No Data at generate')),
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
    const codes = await Promise.all([
        tryURL(`https://ubisoft-avatars.akamaized.net/${genome}/default_256_256.png`),
        tryURL(`https://ubisoft-avatars.akamaized.net/${genome}/default_tall.png`)]);
    const results = codes.map(c => {
        if (c) {
            const args = [c.slice(0, 18), c.slice(18)];
            return createHash('md5').update(`${genome}_${args[0]}_${ENV.KEY256}`).digest('base64') === args[1] && args[0] === id;
        } else {
            return null;
        }
    });
    console.log(id, genome, 'verifying results', results);
    if (results.some(r => r === true)) {
        return true;
    }
    if (results.some(r => r === false)) {
        return false;
    }
    if (results.every(r => r === null)) {
        return null;
    }
}

async function tryURL(url: string): Promise<string> {
    const QR = new Canvas.Image();
    const res = await fetch(url);
    const buf = await res.buffer();
    return new Promise(res => {
      QR.onload = () => {
        const ctx = Canvas.createCanvas(QR.width, QR.height).getContext('2d');
        ctx.drawImage(QR, 0, 0);
        const imageData = ctx.getImageData(0, 0, QR.width, QR.height);
        try {
            const code = readerQR(imageData.data, imageData.width, imageData.height);
            return res(code?.data);
        } catch (err) {
            console.log(err);
            return res(null);
        }
      }
      QR.src = buf
    });
}
