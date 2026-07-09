
import { ImapFlow } from 'imapflow';
import pino from 'pino';
import { simpleParser } from 'mailparser';
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';

async function run() {
    const rawHtml = fs.readFileSync('main.html', 'utf8');

    // 1. Tentukan waktu awal DI LUAR loop
    let waktuAcakBerjalan = moment().tz('Asia/Jakarta');

    // 2. Launch browser HANYA 1 KALI di luar loop (Super Cepat & Hemat RAM)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (let x = 2; x <= 24; x++) {
        // Tentukan jeda acak 30 - 50 detik dari item SEBELUMNYA
        const detikAcak = Math.floor(Math.random() * (50 - 30 + 1)) + 30;

        // Tambahkan detik acak ke waktu berjalan
        waktuAcakBerjalan.add(detikAcak, 'seconds');

        // Gunakan .clone() agar waktu tidak tidak sengaja terubah (immutability)
        const waktuFile = waktuAcakBerjalan.clone();

        // Manipulasi HTML dengan Cheerio
        const $ = cheerio.load(rawHtml);
        const email = `danarputrapradana${x}@siteprofree.email`;
        $('#email').text(email);
        $('#tanggal').text(`(${waktuFile.format('YYYY-MM-DD HH:mm:ss [WIB]')})`);

        const modifiedHtml = $.html();
        fs.writeFileSync(`res/results${x}.html`, modifiedHtml);

        try {
            const absolutePath = path.resolve(`res/results${x}.html`);
            const fileUrl = `file:///${absolutePath.replace(/\\/g, '/')}`;

            await page.goto(fileUrl, {
                waitUntil: 'networkidle0'
            });

            // Format nama file berdasarkan waktu yang konsisten (+ 1 detik dari waktu di HTML)
            const waktuScreenshot = waktuFile.clone().add(1, 'seconds');
            const namaFile = `Screenshot ${waktuScreenshot.format('YYYY-MM-DD HHmmss')}`;

            await page.screenshot({
                path: `ss/${namaFile}.png`,
                fullPage: true
            });

            console.log(`[BERHASIL] File ${x} -> ${namaFile}`);

        } catch (error) {
            console.error(`[ERROR ${x}]`, error.message);
        }
    }

    // Tutup browser setelah SEMUA loop selesai
    await browser.close();
}
await run()