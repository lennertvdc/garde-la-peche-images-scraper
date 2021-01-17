const scraper = require('./scraper');
const Image = require('./Image');
const path = require('path');

(async () => {
    /*const latestImage = new Image(null, '10158266291688751');
    const images = await scraper.getAllImages(latestImage);
    //https://www.facebook.com/photo.php?fbid=10224775102230203&set=g.956842611031123&type=1&theater&ifg=1*/

    const img = new Image('https://www.facebook.com/photo/?fbid=1093534644444510&set=g.956842611031123', '1093534644444510');
    await img.download();
    const img2 = new Image('https://www.facebook.com/photo?fbid=10224531368057001&set=g.956842611031123', '10224531368057001');
    await img2.download();

    console.log(img, img2);

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
