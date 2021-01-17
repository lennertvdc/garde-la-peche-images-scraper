const browser = require('./browser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = class Image {
    fbUrl;
    fbId;
    imgUrl;
    imgBase64;

    constructor(fbUrl, fbId) {
        this.fbUrl = fbUrl;
        this.fbId = fbId;
    }

    async scrapeImgUrl() {
        try {
            const {browserInstance, page} = await browser.goToPage(this.fbUrl);
            await page.waitForSelector('div[role="main"]');
            const imgUrl = await page.evaluate(() => {
                const div = document.querySelector('div[data-pagelet="MediaViewerPhoto"]');
                const img = div.querySelector('img');
                return img.src;
            });
            await browserInstance.close();
            return imgUrl;
        } catch (err) {
            console.log('Failed to scrape imgUrl from fbUrl => ', err);
            throw 'Failed to scrape imgUrl from fbUrl';
        }
    }

    async download() {
        this.imgUrl = await this.scrapeImgUrl();
        const dirPath = path.resolve(__dirname, '.tmp');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
        const filePath = path.resolve(dirPath, this.fbId+'.png');
        const writer = fs.createWriteStream(filePath);

        const response = await axios({
            url: this.imgUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        await this.base64_encode(filePath);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        });
    }

    async base64_encode(imgPath) {
        const bitmap = fs.readFileSync(imgPath);
        this.imgBase64 = Buffer.from(bitmap, 'base64').toString('base64');
    }
}
