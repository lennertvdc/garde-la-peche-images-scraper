const scraper = require('./modules/scraper');
const serverRequest = require('./modules/serverRequest');
const browser = require('./modules/browser');
const config = require('./config');
const cron = require('node-cron');

(async () => {
    if (config.node_env === "production") {
        await runCron();
    } else {
        await scrapeAndSendImages();
    }
})();

async function scrapeAndSendImages() {
    const latestImage = await serverRequest.getLatestImage();
    const images = await scraper.getAllImages(latestImage);
    for (let image of images) {
        await serverRequest.sendImage(image);
    }
    browser.deleteCookies();
}

async function runCron() {
    cron.schedule(`*/${config.minutes_between_run} * * * *`, async () => {
        console.log('Running cron job for scraper.');
        await scrapeAndSendImages();
    }, {});
}
