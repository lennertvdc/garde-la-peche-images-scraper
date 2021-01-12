require('dotenv').config();

module.exports = {
    account: {
        email: process.env.EMAIL,
        password: process.env.PASSWORD,
        loginUrl: "https://www.facebook.com/login"
    },
    pageUrl: 'https://www.facebook.com/groups/gardelapecheglp/photos/',
    chromeOptions: {
        headless: false,
        slowMo: 10,
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    }
};
