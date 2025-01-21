const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const moment = require("moment");
const schedule = require("node-schedule");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

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

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
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

app.get("/", (req, res) => {
  res.send("Bot is running...");
});

app.listen(port, () => {
  console.log(`Bot is running...`);
});

setInterval(() => {
  console.log(moment().format());
}, 30000);

schedule.scheduleJob("05 09 * * *", () => {
  main();
});
