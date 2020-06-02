const puppeteer = require("puppeteer");
const config = require("./config.json");
const fs = require("fs");

async function init() {
    console.log("Opening facebook page");

    let browser, page;
    [browser, page] = await openBrowser();

    console.log("Checking if imagesrepo is up to date...");

    let newestImage = await getNewestPostIfRepoIsNotUpToDate(page);
    browser.close();
    if (newestImage !== null) {
        console.log("Updating repo....");

        console.log("Preparing download queue!")
        const downloadQueue = await getDownloadQueue(newestImage);

        // Download queue

        // Add download queue to images.json file

        // (Delete cookies)
        
    }
}

async function openBrowser() {
    const chromeOptions = {
        headless: false,
        slowMo: 10,
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    };
    const browser = await puppeteer.launch(chromeOptions);
    const context = browser.defaultBrowserContext();
    context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
    const page = await browser.newPage();

    await insertLoginCookies(page);

    return [browser, page];
}

async function insertLoginCookies(page) {
    const cookies = require("./cookies.json");
    // Check if there is a previously saved session
    if (Object.keys(cookies).length) {
        // Set the saved cookies in the puppeteer browser page
        await page.setCookie(...cookies);
    } else {
        // Login to facebook
        console.log("Did not found cookies, need to login...");
        await login(page);
    }
}

async function login(page) {
    // Write in the email and password
    const account = config.fb_acc;
    await page.type("#email", account.email, { delay: 30 });
    await page.type("#pass", account.password, { delay: 30 });

    // Press enter to login
    await page.keyboard.press("Enter");

    // Check if logged in
    try {
        await page.waitFor("[data-click='profile_icon']");
        console.log("Succesfully logged in! Saving cookies now.");
        await saveCookiesToFile(page);
        console.log("Cookies saved!");
    } catch (error) {
        console.log("Failed to login.");
        process.exit(0);
    }
}

async function saveCookiesToFile(page) {
    // Get the current browser page session
    let currentCookies = await page.cookies();

    // Create a cookie file (if not already created) to hold the session
    fs.writeFileSync("./cookies.json", JSON.stringify(currentCookies));
}

async function giveNewestPostLink(page) {
    return await page.evaluate(() => {
        const table = document.querySelector("table");
        const firstImage = table.querySelector("td")
        const link = firstImage.querySelector("a").href;

        return link;
    });
}

async function getPostTimestamp(page) {
    await page.waitForSelector("span#fbPhotoSnowliftTimestamp");

    return await page.evaluate(() => {
        const span = document.querySelector("span#fbPhotoSnowliftTimestamp");
        const abbr = span.querySelector("abbr");
        const timestamp = abbr.dataset.utime;

        return timestamp;
    });
}

async function getImageLink(page) {
    return await page.evaluate(() => {
        const stage = document.querySelector("div.stage");
        const image = stage.querySelector("img.spotlight");
        const link = image.src;

        return link;
    })
}

async function getNewestPostIfRepoIsNotUpToDate(page) {
    await page.goto(config.url);

    const latestDownload = getLatestDownload();

    let newestImage = {};
    newestImage.postLink = await giveNewestPostLink(page);

    await page.goto(newestImage.postLink);
    newestImage.timestamp = await getPostTimestamp(page);

    if (newestImage.timestamp != latestDownload.timestamp) {
        console.log("Repo is niet up to date!");
        return newestImage;
    }

    console.log("Repo is up to date!")
    return null;
}

function getLatestDownload() {
    const images = require("./images/images.json");

    return images[images.length - 1];
}

async function goToNextPost(page) {
    await page.keyboard.press("ArrowRight");
}

async function getDownloadQueue(newestImage) {
    let tempPost = newestImage;
    let repoUpToDate = false;

    let downloadQueue = [];
    while (!repoUpToDate) {
        [browser, page] = await openBrowser();
        await page.goto(tempPost.postLink);

        tempPost.img = await getImageLink(page);
        downloadQueue.push(tempPost);
        console.log("Added image to queue! Length of queue is ", downloadQueue.length);

        const nextPost = await getNextPostObject(page);

        const latestDownload = getLatestDownload();
        if (latestDownload.timestamp != nextPost.timestamp) {
            tempPost = nextPost;
        } else {
            repoUpToDate = true;
        }

        browser.close();
    }

    return downloadQueue;
}

async function getNextPostObject(page) {
    await goToNextPost(page);

    const nextPost = {};
    nextPost.postLink = await page.url();
    nextPost.timestamp = await getPostTimestamp(page);

    return nextPost;
}

init();