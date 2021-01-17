const scraper = require('./modules/scraper');
const Image = require('./classes/Image');
const path = require('path');
const fs = require('fs');
const browser = require('./modules/browser');

(async () => {
    const latestImage = new Image('https://www.facebook.com/photo?fbid=10224614158928414&set=g.956842611031123', '10224614158928414');
    const shortTest = new Image('https://www.facebook.com/photo?fbid=1093535624444412&set=g.956842611031123', '1093535624444412');
    const images = await scraper.getAllImages(shortTest);

    console.log(images);

    // browser.goToPage('https://www.facebook.com/photo.php?fbid=10224775102230203&set=g.956842611031123&type=1&theater&ifg=1');




    /*const latestImage = new Image(null, '10158266291688751');
    const images = await scraper.getAllImages(latestImage);
    //https://www.facebook.com/photo.php?fbid=10224775102230203&set=g.956842611031123&type=1&theater&ifg=1*/

    // const img = new Image('https://www.facebook.com/photo/?fbid=1093534644444510&set=g.956842611031123', '1093534644444510');
    // await img.download();
    //
    // const img2 = new Image('https://www.facebook.com/photo?fbid=10224531368057001&set=g.956842611031123', '10224531368057001');
    // await img2.download();


    /*const bitmap = fs.readFileSync(path.resolve(__dirname, '.tmp', '1093534644444510.png')).toString('base64');

    console.log(bitmap)*/

})();

/*async function scrapeAndSendPosts() {
    const newestPosts = await scraper.getNewestPosts();

    newestPosts.forEach(post => {
        serverRequest.sendPost(post);
    });
}

function runCron() {
    cron.schedule(`*!/${config.minutes_between_run} * * * *`, () => {
        console.log("Running cron job for scraper.");
        scrapeAndSendPosts();
    });
}

if(config.NODE_ENV === "production") {
    runCron();
} else {
    scrapeAndSendPosts();
}*/
