/* eslint-disable no-sync */
import "process";
import * as BrowserFS from "browserfs";
import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
console.log(os.platform());
assert.strictEqual(typeof os.platform(), "string");
assert.strictEqual(path.join("a", "b"), "a/b");
assert.strictEqual(path.posix.dirname("/test1/test2/test3"), "/test1/test2");
assert.strictEqual(typeof process.pid, "number");

try {
  console.log(require("external-test"));
} catch (err) {
  console.log("Require worked as expected");
}
// eslint-disable-next-line new-cap
BrowserFS.FileSystem.InMemory.Create(null, (err, mfs) => {
  if (err) {
    throw err;
  }
  BrowserFS.initialize(mfs);
  fs.writeFileSync("./test.txt", "hello", "utf8");
  assert.strictEqual(fs.readFileSync("./test.txt", "utf8"), "hello");
  fs.unlinkSync("./test.txt");
});

export default {};
