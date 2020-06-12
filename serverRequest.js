const axios = require("axios");

async function getLatestPost() {
    try {
        const latestPost = await axios.get("http://localhost:5000/api/posts/latest");

        return latestPost.data[0];

    } catch (error) {
        console.log("Could not get latest post!");
        console.log(error);
    }
}

async function sendPost(post) {
    try {
        const res = await axios.post("http://localhost:5000/api/posts", post);
        console.log(res.statusText);
    } catch (error) {
        console.log("Could not send post to the server!");
        console.log(error);
    }
}

async function getAllWebhooks() {
    try {
        const webhooks = await axios.get("http://localhost:5000/api/webhooks");

        return webhooks.data;
    } catch (error) {
        console.log("Could not get all webhooks!");
        console.log(error);
    }
}

module.exports = {
    getLatestPost,
    sendPost,
    getAllWebhooks
}