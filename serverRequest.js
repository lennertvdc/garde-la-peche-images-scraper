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
        console.log("Succesfully sended post to the server.");
    } catch (error) {
        console.log("Could not send post to the server!");
        console.log(error);
    }
}

module.exports = {
    getLatestPost,
    sendPost
}