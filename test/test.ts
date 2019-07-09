import assert from "assert";
import os from "os";
import path from "path";
import process from "process";
console.log(os.platform());
assert(typeof os.platform() === "string");
assert(path.join("a", "b") === "a/b");
assert(typeof process.pid === "number");

try {
  console.log(require("external-test"));
} catch (err) {
  console.log("Require worked as expected");
}
export default {};
