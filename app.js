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
    const queue = await getDownloadQueue(browser, cookies, newestPostUrl);
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

async function getDownloadQueue(browser, cookies, url) {
    const page = await browser.newPage();

    await page.setCookie(...cookies);

    await page.goto(url);

    const postData = await getPostData(page);
    const nextPostLink = await getNextPostLink(page);

    await page.close();

    const latestDownloadUrl = getLatestDownloadUrl();
    if (nextPostLink === latestDownloadUrl) {
        return postData;
    } else {
        return postData.concat(await getDownloadQueue(browser, cookies, nextPostLink));
    }
}

async function getPostData(page) {
    // Waiting for being loaded
    await page.waitFor("span#fbPhotoSnowliftTimestamp abbr");

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

async function getNextPostLink(page) {
    await page.keyboard.press("ArrowRight");
    return page.url();
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
