if (typeof (process as any).browser !== "undefined") {
  process.hrtime = require("browser-process-hrtime");
  process.stdout = require("browser-stdout")();
  process.pid = 1;
  process.versions = {
    ares: "1.15.0",
    brotli: "1.0.7",
    cldr: "34.0",
    http_parser: "2.8.0",
    icu: "63.1",
    llhttp: "1.1.1",
    modules: "67",
    napi: "4",
    nghttp2: "1.37.0",
    node: "11.15.0",
    openssl: "1.1.1b",
    tz: "2018e",
    unicode: "11.0",
    uv: "1.27.0",
    v8: "7.0.276.38-node.19",
    zlib: "1.2.11"
  } as any;
  process.version = "v11.15.0";
}
export default process;
