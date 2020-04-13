import { UUID } from '@r6ru/types';
import { AwesomeQRCode, QRErrorCorrectLevel } from 'awesome-qr';
import * as Canvas from 'canvas';
import { createHash } from 'crypto';
import readerQR from 'jsqr';
import fetch from 'node-fetch';
import ENV from './env';

async function tryURL(url: string): Promise<string> {
    const QR = new Canvas.Image();
    const res = await fetch(url);
    QR.src = await res.buffer();
    const ctx = Canvas.createCanvas(QR.width, QR.height).getContext('2d');
    ctx.drawImage(QR, 0, 0);
    const imageData = ctx.getImageData(0, 0, QR.width, QR.height);
    try {
        const code = readerQR(imageData.data, imageData.width, imageData.height);
        return code?.data;
    } catch (err) {
        console.log(err);
        return null;
    }
}

const withParams = (func, id: string, genome: string) => (code: string) => func(code, id, genome);

function checkCode(code: string, id: string, genome: string) {
    if (code) {
        const args = code.split('.');
        return id === args[0] && createHash('md5').update(`${id}_${genome}_${ENV.KEY256}`).digest('base64') === args[1];
    } else {
        return null;
    }
}

function checkCodeLegacy(code: string, id: string, genome: string) {
    if (code) {
        const args = [code.slice(0, 18), code.slice(18)];
        return (
            createHash('md5').update(`${genome}_${args[0]}_${ENV.KEY256}`).digest('base64') === args[1] &&
            args[0] === id
        );
    } else {
        return null;
    }
}

export function generate(genome: UUID, id: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        new AwesomeQRCode().create({
            autoColor: false,
            backgroundDimming: 'rgba(0,0,0,0)',
            backgroundImage: __dirname + '/../../assets/r6rus.png',
            borderDark: 'rgba(0, 0, 0, .1)',
            borderLight: 'rgba(255, 255, 255, .1)',
            callback: (data) => (data ? resolve(data) : reject(new Error('QR No Data at generate'))),
            colorDark: 'rgba(0, 0, 0, 0.8)',
            colorLight: 'rgba(255, 255, 255, 1)',
            correctLevel: QRErrorCorrectLevel.H,
            dotScale: 0.6,
            drawPosition: false,
            logoCornerRadius: 8,
            margin: 5,
            size: 500,
            text: `${id}.${createHash('md5').update(`${id}_${genome}_${ENV.KEY256}`).digest('base64')}`,
            typeNumber: 4,
            whiteMargin: true,
        });
    });
}

export async function verify(genome: UUID, id: string): Promise<boolean> {
    const codes = await Promise.all(
        ['http', 'https']
            .map((protocol) =>
                [146, 256].map(
                    (res) => `${protocol}://ubisoft-avatars.akamaized.net/${genome}/default_${res}_${res}.png`,
                ),
            )
            .reduce((a, b) => a.concat(b), [])
            .map(tryURL),
    );
    const results = [checkCode, checkCodeLegacy]
        .map((func) => codes.map(withParams(func, id, genome)))
        .reduce((a, b) => a.concat(b), []);
    console.log(id, genome, 'verifying results', results);
    switch (true) {
        case results.some((r) => r === true):
            return true;
        case results.some((r) => r === false):
            return false;
        case results.every((r) => r === null):
            return null;
    }
}
