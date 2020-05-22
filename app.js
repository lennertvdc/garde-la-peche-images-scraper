const puppeteer = require("puppeteer");
const fs = require("fs");
const cookies = require("./cookies.json");
const config = require("./config.json");
const latestDownload = require("./latest-download.json");

async function init() {
    const SCRAPE_URL = config.scrape_url;
    const browser = await puppeteer.launch({ headless: false });
    const context = browser.defaultBrowserContext();
    context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
    const page = await browser.newPage();
    // TEMP
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
    });

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

    let downloadQueue;
    if(latestDownload.timestamp != "null") {
        downloadQueue = await updateImages(page);
    } else {
        console.log("Downloading all images...");
    }

    console.log("Ready for downloading!");
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

async function scrollToNewFeed(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            let distance = 100;
            let scrollHeight = document.body.scrollHeight;
            let timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function updateImages(page) {
    let readyToDownload = false;
    while (!readyToDownload) {
        let returnArr = await page.evaluate((latestDownload) => {
            let downloadQueue = [];
            let postsFeed = document.querySelectorAll('div[data-testid="newsFeedStream"]')[0].querySelectorAll('div[data-fte="1"');
            let latestDownloadTimestamp = latestDownload.timestamp;

            let upToDate = false;
            postsFeed.forEach(post => {
                let postTimestamp = post.querySelector('.timestampContent').parentElement.dataset.utime;
                if (!upToDate && postTimestamp != latestDownloadTimestamp) {
                    if (post.querySelector("a[rel='theater']") != null) {
                        let img = {
                            link: post.querySelector("a[rel='theater']").querySelector("img").src,
                            timestamp: postTimestamp
                        }
                        downloadQueue.push(img);
                    }
                } else {
                    upToDate = true;
                }

            });

            return [upToDate, downloadQueue]
        }, latestDownload);

        let upToDate = returnArr[0];
        if (!upToDate) {
            await scrollToNewFeed(page);
        } else {
            readyToDownload = true;
            return returnArr[1];   
        }
    }
}


init();