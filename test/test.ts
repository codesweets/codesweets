/* eslint-disable no-duplicate-imports */
/* eslint-disable no-sync */
import {Buffer} from "buffer";
import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import process1 from "process";
import process2 from "process";
(global as any).test = 1;
console.log(os.platform(), (global as any).test);
assert.strictEqual(typeof os.platform(), "string");
assert.strictEqual(path.join("a", "b"), "a/b");
assert.strictEqual(path.posix.dirname("/test1/test2/test3"), "/test1/test2");
assert.strictEqual(typeof process.pid, "number");
process.env.test = "hello";
assert.strictEqual(process1.env.test, "hello");
assert.strictEqual(process2.env.test, "hello");
assert.strictEqual(Buffer.from("hello").toString(), "hello");
// eslint-disable-next-line no-undef
assert.strictEqual((window as any).currentModule, "test");
console.log(require("@codesweets/core"));

fs.writeFileSync("./test.txt", "hello", "utf8");
assert.strictEqual(fs.readFileSync("./test.txt", "utf8"), "hello");

export default "working";
console.log("Completed");
