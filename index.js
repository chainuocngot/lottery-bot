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

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.goto("https://lottery-web-v2.vercel.app/", {
    waitUntil: "domcontentloaded",
  });
  await page.type('input[type="password"]', "71790305");
  await page.click('input[type="password"] ~ button');

  await page.waitForSelector(".top");
  await page.addStyleTag({ path: "./custom.css" });
  const section = await page.waitForSelector("body");
  await new Promise((r) => setTimeout(r, 10000));

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

  await axios.post(
    "https://discord.com/api/webhooks/1331125622323417108/DwAkCF2W2TfUZ7zoVFzA6bK1QP-W42hdnYAgRIJ_9H8x_KAU5LyYWQg9hFFnxitRV_9y",
    form,
    {
      headers: {
        ...form.getHeaders(),
      },
    },
  );
};

const main = async () => {
  const path = await capture();
  await send(path);
};

main();
