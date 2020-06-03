const puppeteer = require("puppeteer");
const config = require("./config.json");

async function init() {
    const browser = await openBrowser();
    const cookies = await getLoginCookies(browser);
    const newestPostUrl = "https://www.facebook.com/photo.php?fbid=1430022817203387&set=g.956842611031123&type=1&ifg=1";
    
    const downloadQueue = await getDownloadQueue(browser, cookies, newestPostUrl);
    console.log(downloadQueue);


    await browser.close();
}

async function openBrowser() {
    const browser = await puppeteer.launch(config.chromeOptions);
    const context = browser.defaultBrowserContext();
    context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);

    return browser;
}

async function getDownloadQueue(browser, cookies, url) {
    const page = await browser.newPage();

    await page.setCookie(...cookies);

    await page.goto(url);

    const postData = await getPostData(page);
    const nextPostLink = await getNextPostLink(page);

    await page.close();

    const latestDownloadUrl = getLatestDownloadUrl();
    if(nextPostLink === latestDownloadUrl) {
        return postData;
    } else {
        return postData.concat(await getDownloadQueue(browser, cookies, nextPostLink));
    }
}

async function getPostData(page) {
    // Waiting for being loaded
    await page.waitFor("span#fbPhotoSnowliftTimestamp abbr");

    let postData = await page.evaluate(() => {
        return {
            timestamp: document.querySelector("span#fbPhotoSnowliftTimestamp abbr").dataset.utime,
            img: document.querySelector("div.stage img.spotlight").src
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

async function getLoginCookies(browser) {
    const page = await browser.newPage();
    const account = config.account;

    await page.goto(account.loginUrl);

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

    const cookies = await page.cookies();

    await page.close();

    return cookies;
}

init();
