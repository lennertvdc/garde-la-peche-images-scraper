const puppeteer = require("puppeteer");
const fs = require("fs");
const cookies = require("./cookies.json");
const config = require("./config.json");
const latestDownload = require("./latest-download.json");
const Axios = require("axios");
const Path = require("path")

async function init() {
    const SCRAPE_URL = config.scrape_url;
    const browser = await puppeteer.launch();
    const context = browser.defaultBrowserContext();
    context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
    const page = await browser.newPage();

    // Check if there is a previously saved session
    if (Object.keys(cookies).length) {

        // Set the saved cookies in the puppeteer browser page
        await page.setCookie(...cookies);

    } else {
        // Login to facebook
        await login(page);
    }

    // Go to facebook page for scraping
    await page.goto(SCRAPE_URL, { waitUntil: "networkidle2" });

    // Go to page of first image
    const link = await giveFirstImageLink(page);
    await page.goto(link, { waitUntil: "networkidle2" });

    // Create a downloadQueue
    const newestPostTimestamp = await getPostTimestamp(page);
    if (newestPostTimestamp != latestDownload.timestamp) {
        const downloadQueue = await getDownloadQueue(page);
        browser.close();

        // Download the queue
        console.log(`Start downloading ${downloadQueue.length} images...`);
        await startDownload(downloadQueue);
        console.log("Queue succesfully downloaded!");

        // Update latest-download.json
        updateLatestDownloadFile(newestPostTimestamp);
    } else {
        browser.close();
        console.log("No images needed to be downloaded, image repository is up to date!");
    }
}

async function login(page) {
    const LOGIN_URL = config.login_url;

    // Go to facebook login page
    await page.goto(LOGIN_URL, { waitUntil: "networkidle0" });

    // Write in the email and password
    const account = config.fb_acc;
    await page.type("#email", account.email, { delay: 30 });
    await page.type("#pass", account.password, { delay: 30 });

    // Click login button
    await page.click("#loginbutton");

    // Wait for navigation to finish
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    // Check if logged in
    try {
        await page.waitFor("[data-click='profile_icon']");
    } catch (error) {
        console.log("Failed to login.");
        process.exit(0);
    }

    // Get the current browser page session
    let currentCookies = await page.cookies();

    // Create a cookie file (if not already created) to hold the session
    fs.writeFileSync("./cookies.json", JSON.stringify(currentCookies));
}

async function giveFirstImageLink(page) {
    return await page.evaluate(() => {
        const table = document.querySelector("table");
        const firstImage = table.querySelector("td")
        const link = firstImage.querySelector("a").href;

        return link;
    });
}

async function getDownloadQueue(page) {
    let readyToDownload = false;
    let downloadQueue = [];
    while (!readyToDownload) {
        const latestDownloadedImg = latestDownload.timestamp;
        let timestamp = await getPostTimestamp(page);
        if (timestamp != latestDownloadedImg) {
            let downloadObject = await getDownloadObject(page, timestamp);
            downloadQueue.push(downloadObject);
            console.log(`Add image to queue! Length of queue is ${downloadQueue.length}`);

            await page.click("a[title='Volgende']");
            await page.waitForSelector("span#fbPhotoSnowliftTimestamp");
        } else {
            readyToDownload = true;
        }
    }

    return downloadQueue;
}

async function getPostTimestamp(page) {
    return await page.evaluate(() => {
        const span = document.querySelector("span#fbPhotoSnowliftTimestamp")
        const timestamp = span.querySelector("span.timestampContent").parentElement.dataset.utime;

        return timestamp;
    });
}

async function getDownloadObject(page, timestamp) {
    const imgLink = await getImageLink(page);

    return {
        timestamp: timestamp,
        link: imgLink
    }
}

async function getImageLink(page) {
    return await page.evaluate(() => {
        const stage = document.querySelector("div.stage");
        const image = stage.querySelector("img.spotlight");
        const link = image.src;

        return link;
    })
}

async function startDownload(queue) {
    await queue.forEach(async (img) => {
        const url = img.link;
        const imgName = img.timestamp + ".png";
        const path = Path.resolve(__dirname, 'images', imgName);
        const writer = fs.createWriteStream(path)

        const response = await Axios({
            url,
            method: 'GET',
            responseType: 'stream'
        })

        response.data.pipe(writer)
    });
}

function updateLatestDownloadFile(timestamp) {
    const timestampJson = {
        timestamp: timestamp
    }

    const data = JSON.stringify(timestampJson);
    fs.writeFileSync('latest-download.json', data);
}

init();