const puppeteer = require("puppeteer");
const config = require("./config.json");
const fs = require("fs");

async function init() {
    console.log("Opening facebook page");

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

    console.log("Checking if images are up to date...");

    const repoUpToDate = await checkRepoUpToDate(page);
    if(!repoUpToDate) {
        console.log("Updating repo....");
    }
}

async function insertLoginCookies(page) {
    const cookies = require("./cookies.json");
    // Check if there is a previously saved session
    if (Object.keys(cookies).length) {
        // Set the saved cookies in the puppeteer browser page
        console.log("No need to login, restoring cookies...");
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
    page.keyboard.press("Enter");

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

async function giveNewestImageLink(page) {
    return await page.evaluate(() => {
        const table = document.querySelector("table");
        const firstImage = table.querySelector("td")
        const link = firstImage.querySelector("a").href;

        return link;
    });
}

async function getImageTimestamp(page) {
    return await page.evaluate(() => {
        const span = document.querySelector("span.timestampContent");
        const timestamp = span.parentElement.dataset.utime;

        return timestamp;
    });
}

async function checkRepoUpToDate(page) {
    await page.goto(config.url);

    const latestDownload = getLatestDownload();

    let newestImage = {};
    newestImage.link = await giveNewestImageLink(page);

    await page.goto(newestImage.link);
    newestImage.timestamp = await getImageTimestamp(page);

    if (newestImage.timestamp != latestDownload.timestamp) {
        console.log("Repo is niet up to date!");
        return false;
    }

    console.log("Repo is up to date!")
    return true;
}

function getLatestDownload() {
    const images = require("./images/images.json");

    return images[images.length - 1];
}

init();