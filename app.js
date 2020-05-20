const puppeteer = require("puppeteer");
const fs = require("fs");
const cookies = require("./cookies.json");
const config = require("./config.json");

async function init() {
    const SCRAPE_URL = config.scrape_url;
    const LOGIN_URL = config.login_url;
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Check if there is a previously saved session
    if (Object.keys(cookies).length) {
    
        // Set the saved cookies in the puppeteer browser page
        await page.setCookie(...cookies);
    
    } else {
    
        // Go to facebook login page
        await page.goto(LOGIN_URL, { waitUntil: "networkidle0" });
        
        // Write in the email and password
        const account = config.fb_acc;
        await page.type("#email", account.email, { delay: 30});
        await page.type("#pass", account.password, { delay: 30});

        // Click login button
        await page.click("#loginbutton");

        // Wait for navigation to finish
        await page.waitForNavigation({ waitUntil: "networkidle0"});
        await page.waitFor(15000);

        // Check if logged in
        try {
            await page.waitFor("[data-click='profile_icon']");
        } catch(error) {
            console.log("Failed to login.");
            process.exit(0);
        }

        // Get the current browser page session
        let currentCookies = await page.cookies();

        // Create a cookie file (if not already created) to hold the session
        fs.writeFileSync("./cookies.json", JSON.stringify(currentCookies));
    }

    // Go to facebook page for scraping
    await page.goto(SCRAPE_URL, { waitUntil: "networkidle2" });
}


init();