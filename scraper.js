const browser = require('./browser');
const config = require('./config');
const Image = require('./Image');

async function getAllImages(latestImage) {
    const {browserInstance, page} = await browser.goToPage(config.pageUrl);
    await page.waitForSelector('div[role="main"]');
    await page.waitFor(2000);
    const main = await page.evaluate(async (latestImage) => {
        return await getImages(latestImage);

        async function getImages(latestImage = null, images = []) {
            const div = document.querySelector('div[role="main"]').children[3].firstChild.firstChild.firstChild.firstChild.firstChild.children[1].children;
            for (let i = images.length; i <= div.length; i++) {
                const child = div[i];
                if (child.querySelector('a') === null) {
                    await scrollToLoadImages(div);
                    return await getImages(latestImage, images);
                } else {
                    const url = child.querySelector('a').href;
                    const regex = /([0-9])+/g;
                    const fbid = regex.exec(url)[0];
                    const image = {fbid, url};
                    images.push(image);
                    if (latestImage !== null && fbid === latestImage.fbid) {
                        return images;
                    }
                }
            }
            return images;
        }

        async function scrollToLoadImages(div) {
            return new Promise((resolve, reject) => {
                const numberOfCurrentChildren = div.length;
                let totalHeight = 0;
                const distance = 100;
                let timer = setInterval(async () => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    if (div.length > numberOfCurrentChildren || totalHeight >= scrollHeight) {
                        resolve();
                        clearInterval(timer);
                    }
                }, 400);
            })
        }

        /*async function checkNumberOfChildren(current, div) {
            return div.length > current;
        }*/
    }, latestImage)

    console.log(main);
}


module.exports = {getAllImages}
