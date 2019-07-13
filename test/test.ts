import assert from "assert";
import os from "os";
import path from "path";
import process from "process";
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
export default {};
