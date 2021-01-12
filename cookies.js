const fs = require('fs');

const path = './cookies.json';

function get() {
    try {
        if (fs.existsSync(path)) {
            const data = fs.readFileSync(path, 'utf-8');

            return JSON.parse(data);
        } else {
            return null;
        }
    } catch (error) {
        console.error('Failed to get cookies => ', error);
        throw 'Failed to get cookies';
    }
}

function save(cookies) {
    try {
        fs.writeFileSync(path, JSON.stringify(cookies));
    } catch (error) {
        console.error('Failed to save cookies => ', error);
        throw 'Failed to save cookies';
    }
}

module.exports = {get, save};
