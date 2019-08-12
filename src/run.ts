import {BrowserWindow, app} from "electron";
import {AddressInfo} from "net";
import exphbs from "express-handlebars";
import express from "express";
import path from "path";
import pie from "puppeteer-in-electron";
import proxy from "express-http-proxy";
import puppeteer from "puppeteer-core";
import sweetPack from "./packer";
import yargs from "yargs";
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "1";
process.noDeprecation = true;

const DEBUG = typeof process.env.CODESWEETS_DEBUG !== "undefined";

yargs.command([
  "build",
  "$0"
], "Build a codesweets project", (yarg) => yarg.option("config", {
  describe: "The configuration file we want to load"
}), async (argv) => {
  console.log("Building...");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(path.resolve(argv.config as string || "./codesweets.config.js"));
  await sweetPack(config);
  app.exit();
});

yargs.command("run", "Run your code in a browser instance", (yarg) => yarg.option("script", {
  describe: "The script we want to load"
}), async (argv) => {
  console.log("Running...");
  const expressApp = express();
  expressApp.engine("handlebars", exphbs());
  expressApp.set("view engine", "handlebars");
  expressApp.set("views", path.join(__dirname, "../views"));

  expressApp.use("/_codesweets/", express.static(path.resolve(__dirname, "..")));
  expressApp.use("/_project/", express.static("."));
  expressApp.get("/_project/_loader", (req, res) => {
    res.render("loader", {
      script: argv.script
    });
  });
  expressApp.use("/", proxy("https://unpkg.com/"));

  const browser = await pie.connect(app, puppeteer);
  await app.whenReady();

  const window = new BrowserWindow({
    show: DEBUG
  });

  if (DEBUG) {
    window.webContents.openDevTools();
  }

  const page = await pie.getPage(browser, window);

  page.on("console", async (message) => {
    const printer = message.type() === "warning" || message.type() === "error" ? console.error : console.log;
    try {
      const args = await Promise.all(message.args().map((handle) => handle.jsonValue()));
      printer(...args);
    } catch (err) {
      // Page is closing...
      printer(message.text());
    }
  });

  let exitCode = 0;

  page.on("pageerror", (error) => {
    console.error(error);
    exitCode = 1;
  });
  page.on("requestfailed", (request) => {
    console.error("Failed to load:", request.url());
    exitCode = 1;
  });

  const server = expressApp.listen(0);
  const address = server.address() as AddressInfo;
  await page.goto(`http://localhost:${address.port}/_project/_loader`, {
    waitUntil: "networkidle0"
  });

  if (!DEBUG) {
    app.exit(exitCode);
  }
});

export default yargs.help().argv;
