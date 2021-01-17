const config = require("../config.json");
const puppeteer = require("puppeteer");
const serverRequest = require("./serverRequest");

async function openBrowser() {
    console.log("Opening browser.");
    const browser = await puppeteer.launch(config.chromeOptions);
    const context = browser.defaultBrowserContext();
    context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);

    return browser;
}

async function getLoginCookies(browser) {
    const page = await browser.newPage();
    const account = config.account;

    await page.goto(account.loginUrl);

    await loginWithCredentials(page, account);

    console.log("Getting login cookies of facebook.")
    const cookies = await page.cookies();

    await page.close();

    return cookies;
}

async function loginWithCredentials(page, account) {
    console.log("Logging in on facebook.");
    // Write in the email and password
    await page.type("#email", account.email, { delay: 30 });
    await page.type("#pass", account.password, { delay: 30 });

    // Press enter to login
    await page.keyboard.press("Enter");

    // Waiting for page to being loaded
    try {
        await page.waitFor("[data-click='profile_icon']");
    } catch (error) {
        console.log("Failed to login.");
    }
}

async function getNewestPostUrl(browser) {
    const page = await browser.newPage();
    await page.goto(config.url);

    const url = await page.evaluate(() => {
        return document.querySelector("table.fbPhotosGrid td a").href;
    });

    page.close();

    return url;
}

async function getNewestPosts() {
    console.log("Start scraping.");
    const browser = await openBrowser();
    const cookies = await getLoginCookies(browser);
    const newestPostUrl = await getNewestPostUrl(browser);

    const newestPosts = await startScrapingPostsFromUrl(browser, cookies, newestPostUrl);

    await browser.close();

    console.log(`Scraping is done returning newestPosts array of length ${newestPosts.length}`)

    return newestPosts.reverse();
}

async function startScrapingPostsFromUrl(browser, cookies, startUrl) {
    const page = await browser.newPage();
    await page.setCookie(...cookies);

    await page.goto(startUrl);

    return await scrapePostAndContinue(browser, cookies, page, 50);
}

async function scrapePostAndContinue(browser, cookies, page, counter) {
    const postData = await getPostData(page);
    await goToNextPost(page);
    const nextPostLink = await page.url();

    const latestPost = await serverRequest.getLatestPost();
    if (nextPostLink === latestPost.fb_url) {
        return postData;
    } else if (counter === 0) {
        console.log("Restarting browser because it is to slow.");
        browser.close();
        const newBrowser = await openBrowser();

        return postData.concat(await startScrapingPostsFromUrl(newBrowser, cookies, nextPostLink));
    } else {
        return postData.concat(await scrapePostAndContinue(browser, cookies, page, --counter));
    }
}

async function goToNextPost(page) {
    await page.keyboard.press("ArrowRight");
}

async function getPostData(page) {
    try {
        // Waiting for being loaded
        await page.waitForSelector("span#fbPhotoSnowliftTimestamp abbr", { timeout: 3000 });

        console.log("Adding image to newest posts array!");
        return await scrapePostDataFromPage(page);
    } catch (error) {
        console.error("Page not loaded, reloading page.");
        await page.reload();

        // Need to return empty array because facebook prevents webscraping :-p
        // Otherwise we have duplicates...
        return [];
    }
}

async function scrapePostDataFromPage(page) {
    let postData = await page.evaluate(() => {
        const timestamp = document.querySelector("span#fbPhotoSnowliftTimestamp abbr").dataset.utime;
        return {
            posted_at: timestamp,
            img_url: document.querySelector("div.stage img.spotlight").src
        };
    });

    postData.posted_at = convertTimestamp(postData.posted_at);
    postData.fb_url = await page.url();

    return [postData];
}

function convertTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toISOString();
}

module.exports = {
    getNewestPosts
}
