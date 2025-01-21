const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const moment = require("moment");

require("dotenv").config();

function capital(input) {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const capture = async () => {
  const screenshotPath = "lottery.jpeg";

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(process.env.WEBSITE_URL, { waitUntil: "domcontentloaded" });
  await page.type('input[type="password"]', "71790305");
  await page.click('input[type="password"] ~ button');

  await page.waitForSelector(".top");
  await page.addStyleTag({ path: "./custom.css" });
  const section = await page.waitForSelector("body");
  await new Promise((r) => setTimeout(r, 5000));

  await section.screenshot({ path: screenshotPath, quality: 100 });

  await browser.close();

  return screenshotPath;
};

const send = async (imagePath) => {
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));
  form.append(
    "content",
    `Kết quả xổ số ngày ${capital(
      moment().locale("vi").format("dddd, DD/MM/YYYY"),
    )}:`,
  );

  await axios.post(process.env.DISCORD_WEBHOOK_URI, form, {
    headers: {
      ...form.getHeaders(),
    },
  });
};

const main = async () => {
  const path = await capture();
  await send(path);
};

const scheduleTask = (hours) => {
  const now = new Date();
  const currentHour = now.getHours();
  const nextHour = hours.find((hour) => hour > currentHour) || hours[0] + 24;
  const nextTime = new Date();
  nextTime.setHours(nextHour % 24, 0, 0, 0);
  const delay = nextTime - now;

  setTimeout(() => {
    main();
    scheduleTask(hours);
  }, delay);
};

const targetHours = [19];

scheduleTask(targetHours);
