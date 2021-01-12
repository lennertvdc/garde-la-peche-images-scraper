const config = require("./config");
const scraper = require("./scraper");
const serverRequest = require("./serverRequest");
const cron = require("node-cron");

const browser = require('./browser');
const login = require('./login');
const cookies = require('./cookies');

(async () => {
    const {browserInstance, page} = await browser.goToPage(config.pageUrl);
    console.log('loaded!');


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
