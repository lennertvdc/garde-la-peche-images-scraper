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
            for (let i = images.length; i <= div.length - 1; i++) {
                const child = div[i];
                if (child.querySelector('div[role="progressbar"]') !== null) {
                    await scrollToLoadImages(div);
                    return await getImages(latestImage, images);
                } else {
                    const image = await getImageData(child);
                    if (latestImage !== null && image.fbId === latestImage.fbId) {
                        return images;
                    } else {
                        images.push(image);
                    }
                }
            }
            return images;
        }

        async function scrollToLoadImages(div) {
            return new Promise((resolve, reject) => {
                const currentDivLength = div.length;
                const distance = 100;
                let timer = setInterval(async () => {
                    window.scrollBy(0, distance);
                    if (div.length > currentDivLength || div[div.length - 1].querySelector('div[role="progressbar"]') === null) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        }

        async function getImageData(div) {
            const fbUrl = div.querySelector('a').href;
            const regex = /([0-9])+/g;
            const fbId = regex.exec(fbUrl)[0];
            const alt = div.querySelector('img').alt;
            return {fbUrl, fbId, alt};
        }
    }, latestImage);

    console.log(main[main.length-1], main.length);
}


module.exports = {getAllImages}
