# Garde la pêche image scraper

## Overview
This is a Puppeteer based web scraper. It's purpose is to scape images from the [garde la pêche facebook group](https://www.facebook.com/groups/gardelapecheglp/) and send the new images to the api.

## Setup
### Clone the repo and install dependencies via NPM:
```
npm install
```
### Edit config file
#### NODE_ENV
If you want to run the script by the cron job. Simply change it to `production`. Otherwise the script will run once.

#### minutes_between_run
Change this if you want to change the time between every run of the scraper. The scraper will run every 5 minutes by default.

## Running the scraper
If you changed the `NODE_ENV` in the config file to `production` then the script will run the cron job. Otherwise it will run just once.

```
npm start
```