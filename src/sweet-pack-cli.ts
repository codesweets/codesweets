#!/usr/bin/env node
import path from "path";
import sweetPack from "./sweet-pack";
import yargs from "yargs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require(path.resolve(yargs.argv.config as string || "./sweet.config.js"));
sweetPack(config as any);
