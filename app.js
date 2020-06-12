const scraper = require("./scraper");
const serverRequest = require("./serverRequest");

async function scrapeAndSendPosts() {
    const newestPosts = await scraper.getNewestPosts();

    newestPosts.forEach(post => {
        serverRequest.sendPost(post);
    });
}

scrapeAndSendPosts();
