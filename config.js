require('dotenv').config();

module.exports = {
    node_env: process.env.NODE_ENV,
    account: {
        email: process.env.EMAIL,
        password: process.env.PASSWORD,
        loginUrl: "https://www.facebook.com/login"
    },
    pageUrl: 'https://www.facebook.com/groups/gardelapecheglp/media',
    chromeOptions: {
        headless: false,
        slowMo: 10,
        devtools: true,
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    }
};
