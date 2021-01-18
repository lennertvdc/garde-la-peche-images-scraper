require('dotenv').config();

module.exports = {
    node_env: process.env.NODE_ENV,
    minutes_between_run: 10,
    account: {
        email: process.env.EMAIL,
        password: process.env.PASSWORD,
        loginUrl: "https://www.facebook.com/login"
    },
    pageUrl: 'https://www.facebook.com/groups/gardelapecheglp/media',
    apiUrl: process.env.API,
    chromeOptions: {
        headless: false,
        slowMo: 10,
        devtools: false,
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    }
};
