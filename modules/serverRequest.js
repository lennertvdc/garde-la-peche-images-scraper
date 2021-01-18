const axios = require('axios');
const config = require('../config');
const Image = require('../classes/Image');

const API_BASE = config.apiUrl;

async function getLatestImage() {
    try {
        const req = await axios.get(API_BASE + 'images/latest');
        if (!req.data.length) {
            return null;
        } else {
            const data = req.data[0];

            const latestImage = new Image(data.fb_url, data.fb_id);
            latestImage.imgUrl = data.img_url;
            latestImage.imgBase64 = data.img_base64;

            return latestImage;
        }
    } catch (error) {
        console.log('Could not get latest image!');
        console.log(error);
    }
}

async function sendImage(image) {
    try {
        await axios.post(API_BASE + 'images/', image);
        console.log('Succesfully sended image to the server.');
    } catch (error) {
        console.log('Could not send image to the server!');
        console.log(error);
    }
}

module.exports = {
    getLatestImage,
    sendImage
}
