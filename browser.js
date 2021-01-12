const puppeteer = require('puppeteer');
const config = require('./config');
const cookies = require('./cookies');
const login = require('./login');

async function openBrowser() {
    try {
        const browser = await puppeteer.launch(config.chromeOptions);
        const context = browser.defaultBrowserContext();
        await context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);

        return browser;
    } catch (exception) {
        console.log('Browser could not open => ', exception);
        throw 'Browser could not open';
    }
}

async function goToPage(url) {
    try {
        const browser = await openBrowser();
        const page = await browser.newPage();
        let pageCookies = cookies.get();
        if (pageCookies === null) {
            const loginPage = await browser.newPage();
            pageCookies = await login(loginPage);
            await loginPage.close();
        }
        await page.setCookie(...pageCookies);
        await page.goto(url);

        return {browserInstance: browser, page};
    } catch (exception) {
        console.log('Failed to load page => ', exception);
        throw 'Failed to load page';
    }
}

module.exports = {goToPage};
