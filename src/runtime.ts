/* eslint-disable no-undef */
// eslint-disable-next-line init-declarations,no-var
declare var BrowserFS: typeof import("browserfs");
let main: any = null;
let test: any = null;
const windowAny = window as any;
windowAny.modules = {};
windowAny.require = (partialPath: string, libraryName?: string): any => {
  const library = libraryName || partialPath;
  const unpackage = "https://unpkg.com";
  const path = ((): string => {
    if (partialPath.startsWith(".") || partialPath.startsWith(unpackage)) {
      return partialPath;
    }
    return new URL(partialPath, unpackage).href;
  })();
  console.log(`Begin require '${path}'`);
  const existingModule = windowAny.modules[path];
  if (existingModule) {
    console.log(`End require (existed) '${path}'`);
    return existingModule;
  }
  const request = new XMLHttpRequest();
  request.open("GET", path, false);
  request.send();
  if (request.status !== 200) {
    throw new Error(request.statusText);
  }
  const lastModule = windowAny.currentModule;
  windowAny.currentModule = library;
  // eslint-disable-next-line no-eval
  const result = eval(request.responseText);
  main = main && null;
  test = test && null;
  windowAny.currentModule = lastModule;
  windowAny.modules[path] = result;
  console.log(`End require (imported) '${path}'`);
  return result;
};

BrowserFS.install(window);
import streamBuffers from "stream-buffers";
// eslint-disable-next-line new-cap
BrowserFS.FileSystem.InMemory.Create(null, (error, inMemory) => {
  if (error) {
    throw error;
  }
  // Note that this is synchronous and occurs before the end of Create.
  BrowserFS.initialize(inMemory);
  windowAny.inMemory = inMemory;

  // eslint-disable-next-line no-sync
  inMemory.utimesSync = () => {
    // Ignore times for now
  };

  const fsAny = windowAny.require("fs");
  const fs: typeof import("fs") = fsAny;

  fsAny.createReadStream = (path: string | number | Buffer | URL, options: string | any) => {
    // eslint-disable-next-line no-sync
    const file = fs.readFileSync(path, options);
    const stream = new streamBuffers.ReadableStreamBuffer(options);
    const encoding =
      typeof options === "string" && options ||
      typeof options === "object" && options.encoding as string;
    stream.put(file, encoding);
    return stream;
  };

  fsAny.createWriteStream = (path: string | number | Buffer | URL, options: string | any) => {
    const opts = typeof options === "string" ? {encoding: options} : options;
    const stream = new streamBuffers.WritableStreamBuffer(opts);
    stream.on("finish", () => {
      // eslint-disable-next-line no-sync
      fs.writeFileSync(path, stream.getContents(), opts);
    });
    return stream;
  };
});
