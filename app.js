const scraper = require('./scraper');
const Image = require('./Image');

(async () => {
    const latestImage = new Image('10158266291688751');
    const images = await scraper.getAllImages(latestImage);
    //https://www.facebook.com/photo.php?fbid=10224775102230203&set=g.956842611031123&type=1&theater&ifg=1

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
