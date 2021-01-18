const browser = require('../modules/browser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = class Image {
    fbUrl;
    fbId;
    imgUrl;
    imgBase64;
    imgPath;

    constructor(fbUrl, fbId) {
        this.fbUrl = fbUrl;
        this.fbId = fbId;
    }

    async scrapeImgUrl() {
        const {browserInstance, page} = await browser.goToPage(this.fbUrl);
        try {
            await page.waitForSelector('div[role="main"]');
            await page.waitFor(1000);
            const imgUrl = await page.evaluate(() => {
                const div = document.querySelector('div[data-pagelet="MediaViewerPhoto"]');
                const img = div.querySelector('img');
                return img.src;
            });
            await browserInstance.close();
            return imgUrl;
        } catch (err) {
            await browserInstance.close();
            console.log('Failed to scrape imgUrl from fbUrl => ', err);
            throw 'Failed to scrape imgUrl from fbUrl';
        }
    }

    async download() {
        this.imgUrl = await this.scrapeImgUrl();
        const dirPath = path.resolve(__dirname, '..' ,'.tmp');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
       this.imgPath = path.resolve(dirPath, this.fbId + '.png');
        const writer = fs.createWriteStream(this.imgPath);

        const response = await axios({
            url: this.imgUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })
    }

    base64_encode() {
        this.imgBase64 = fs.readFileSync(this.imgPath).toString('base64');
    }

    toJSON() {
        return {
            fbId: this.fbId,
            fbUrl: this.fbUrl,
            imgUrl: this.imgUrl,
            imgBase64: this.imgBase64
        }
    }
}
