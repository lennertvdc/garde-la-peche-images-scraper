const cookies = require('./cookies');
const config = require('./config');

async function login(page) {
    const url = config.account.loginUrl;
    await page.goto(url);
    try {
        await page.click('button[data-testid="cookie-policy-banner-accept"]');
        await enterCredentials(page);
        await page.waitForSelector('a[href="/me/"]');
    } catch (error) {
        console.log('Failed to login => ', error);
        throw 'Failed to login';
    }
    const pageCookies = await page.cookies();
    await cookies.save(pageCookies);

    return pageCookies;
}

async function enterCredentials(page) {
    try {
        const account = config.account;
        await page.type('#email', account.email, {delay: 30});
        await page.type('#pass', account.password, {delay: 30});
        await page.keyboard.press('Enter');
    } catch (error) {
        console.log('Failed to enter credentials => ', error);
        throw 'Failed to enter credentials';
    }
}

module.exports = (page) => login(page);
