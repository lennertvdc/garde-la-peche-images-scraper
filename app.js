const config = require("./config.json");
const scraper = require("./scraper");
const serverRequest = require("./serverRequest");

async function init() {
    const newestPosts = scraper.getNewestPosts();
}

init();
