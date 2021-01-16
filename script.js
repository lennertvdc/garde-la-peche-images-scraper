const latestImage = {fbid: '10224531359416785'};

console.log(await getImages());


async function getImages(latestImage = null, images = [], totalHeight = 0) {
    //div from bateko page
    const div = document.querySelectorAll('div[role="main"]')[1].children[3].firstChild.firstChild.children[2].firstChild.firstChild.firstChild.children[1].children;
    for (let i = images.length; i <= div.length-1; i++) {
        const child = div[i];
        console.log(child, child.querySelector('a'), i, div.length);
        if (child.querySelector('a') === null && totalHeight <= document.body.scrollHeight) {
            const newTotalHeight = await scrollToLoadImages(div, checkNumberOfChildren, totalHeight);
            return await getImages(latestImage, images, newTotalHeight);
        } else if(child.querySelector('a') !== null){
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

async function scrollToLoadImages(div, resolveCheckFunction, totalHeight = 0) {
    return new Promise((resolve, reject) => {
        const numberOfCurrentChildren = div.length;
        const distance = 100;
        let timer = setInterval(async () => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (await resolveCheckFunction(numberOfCurrentChildren, div) || totalHeight >= scrollHeight) {
                clearInterval(timer);
                resolve(totalHeight);
            }
        }, 100);
    })
}

async function checkNumberOfChildren(current, div) {
    return div.length > current;
}

