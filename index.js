const functions = require('@google-cloud/functions-framework');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');
const fs = require('fs');
const { join } = require('path');

const cachePath = join('/tmp', '.cache', 'puppeteer');

if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath, { recursive: true });
}
console.log('Cache path is: ' + cachePath);
async function launchBrowser() {
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    timeout: 60000,
  });
}
// Register a CloudEvent callback with the Functions Framework that will
// be executed when the Pub/Sub trigger topic receives a message.
functions.cloudEvent('questionnaireFiller', async cloudEvent => {
  let browser;
  try {
    console.log('Launching browser...');
    let browser = await launchBrowser();
    console.log('Browser launched');
    const page = await browser.newPage();
    console.log('Navigating to the page...');
    await page.goto('https://ristomattitoivonen.shinyapps.io/morning-wellness/', { timeout: 60000 });
    console.log('Waiting for login field...');

    await page.waitForSelector('#login-user_name', {visible: true});
    await page.waitForSelector('#login-password', { visible: true});
    await page.waitForSelector('#login-button', {visible: true});
    console.log('Logging in...');
    await page.type('#login-user_name', 'Your-Username-Here');
    await page.type('#login-password', 'Your-Password-Here');
    await page.waitForTimeout(1000);
    await page.click('#login-button');
    await page.waitForTimeout(11000);

    console.log('Logged in');
    await page.waitForSelector('#q13', {visible: true});
    await page.waitForSelector('#q23', {visible: true});
    await page.waitForSelector('#q33', {visible: true});
    await page.waitForSelector('#q43', {visible: true});
    await page.waitForSelector('#q53', {visible: true});
    await page.waitForSelector('#register', {visible: true});

    console.log('Filling questionnaire...');
    await page.click('#q13');
    await page.click('#q23');
    await page.click('#q33');
    await page.click('#q43');
    await page.click('#q53');
    console.log('Questionnaire filled');

    await page.waitForTimeout(2000);
    console.log('Submitting...')
    await page.click('#register');
    console.log('Submitted')
    await page.waitForTimeout(10000);
    console.log('Closing browser...');
    await browser.close();
    console.log('Browser closed');
    
  } catch (e) {
    console.error(e);
  } finally {
    if (browser) {
    console.log('Closing broser inside "finally" block...');
    await browser.close();
    console.log('Browser closed');
    }
  }
});
