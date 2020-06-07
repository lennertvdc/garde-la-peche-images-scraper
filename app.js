const puppeteer = require("puppeteer");
const fs = require("fs");
const Axios = require("axios");
const Path = require("path");
const config = require("./config.json");

async function init() {
    const browser = await openBrowser();
    const cookies = await getLoginCookies(browser);
    const newestPostUrl = await getNewestPostUrl(browser);

    console.log("Preparing download queue.");
    const queue = await getDownloadQueueFromUrl(browser, cookies, newestPostUrl);
    console.log("Download queue is ready!");

    await browser.close();

    await downloadQueue(queue);

    // Adding download queue to images.json
    await saveQueueToFile(queue);
}

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

async function getDownloadQueueFromUrl(browser, cookies, startUrl) {
    const page = await browser.newPage();
    await page.setCookie(...cookies);

    await page.goto(startUrl);

    return await scrapePostAndContinue(browser, cookies, page, 50);
}

async function scrapePostAndContinue(browser, cookies, page, counter) {
    const postData = await getPostData(page);
    await goToNextPost(page);
    const nextPostLink = await page.url();

    // const latestDownloadUrl = getLatestDownloadUrl();
    const latestDownloadUrl = "https://www.facebook.com/photo.php?fbid=2570025146569280&set=g.956842611031123&type=1&theater&ifg=1";
    if (nextPostLink === latestDownloadUrl) {
        return postData;
    } else if (counter === 0) {
        console.log("Restarting browser because it is to slow.");
        browser.close();
        const newBrowser = await openBrowser();

        return postData.concat(await getDownloadQueueFromUrl(newBrowser, cookies, nextPostLink));
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

        console.log("Adding image to the queue!");
        return await scrapePostDataFromPage(page);
    } catch (error) {
        console.error("Page not loaded, reloading page");
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
            timestamp: timestamp,
            img: {
                url: document.querySelector("div.stage img.spotlight").src,
                name: timestamp + ".png"
            }
        };
    });

    postData.url = await page.url();

    return [postData];
}

function getLatestDownloadUrl() {
    const images = require("./images/images.json");

    return images[images.length - 1].url;
}

async function downloadQueue(queue) {
    console.log(`Downloading queue of ${queue.length} images.`);
    await queue.forEach(async (post) => {
        const img = post.img;
        const path = Path.resolve(__dirname, 'images', img.name);
        const writer = fs.createWriteStream(path)

        const response = await Axios({
            url: img.url,
            method: 'GET',
            responseType: 'stream'
        })

        response.data.pipe(writer)
    });
    console.log("Queue has been downloaded!");
}

async function saveQueueToFile(queue) {
    const json = require("./images/images.json");
    const allDownloadedImages = json.concat(queue.reverse());

    const jsonString = JSON.stringify(allDownloadedImages);
    fs.writeFile("./images/images.json", jsonString, "utf8", (err) => {
        if (err) throw err;
        console.log("Json file has been saved!");
    });
}

init();
