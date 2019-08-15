/* eslint-disable no-sync */
import {Buffer} from "buffer";
import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import proc from "process";
(global as any).test = 1;
console.log(os.platform(), (global as any).test);
assert.strictEqual(typeof os.platform(), "string");
assert.strictEqual(path.join("a", "b"), "a/b");
assert.strictEqual(path.posix.dirname("/test1/test2/test3"), "/test1/test2");
assert.strictEqual(typeof process.pid, "number");
proc.env.test = "hello";
assert.strictEqual(process.env.test, "hello");
assert.strictEqual(Buffer.from("hello").toString(), "hello");
console.log(require("@codesweets/core"));

fs.writeFileSync("./test.txt", "hello", "utf8");
assert.strictEqual(fs.readFileSync("./test.txt", "utf8"), "hello");

export default "working";
console.log("Completed");
