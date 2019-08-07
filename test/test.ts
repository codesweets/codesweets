/* eslint-disable no-sync */
import "process";
import * as BrowserFS from "browserfs";
import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
(global as any).test = 1;
console.log(os.platform(), (global as any).test);
assert.strictEqual(typeof os.platform(), "string");
assert.strictEqual(path.join("a", "b"), "a/b");
assert.strictEqual(path.posix.dirname("/test1/test2/test3"), "/test1/test2");
assert.strictEqual(typeof process.pid, "number");

console.log(require("@codesweets/core"));

// eslint-disable-next-line new-cap
BrowserFS.FileSystem.InMemory.Create(null, (err, mfs) => {
  if (err) {
    throw err;
  }
  BrowserFS.initialize(mfs);
  fs.writeFileSync("./test.txt", "hello", "utf8");
  assert.strictEqual(fs.readFileSync("./test.txt", "utf8"), "hello");
});

export default {};
