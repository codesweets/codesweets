#!/usr/bin/env node
import electron from "electron";
import execa from "execa";
import path from "path";

const main = async () => {
  const args = [
    path.join(__dirname, "./run.js"),
    ...process.argv.slice(2)
  ];
  const options: execa.Options = {
    cwd: process.cwd(),
    reject: false,
    stdio: "inherit"
  };
  const result = await execa(electron as unknown as string, args, options);
  // eslint-disable-next-line no-process-exit
  process.exit(result.exitCode);
};

main();
