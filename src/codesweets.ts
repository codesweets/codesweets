import dir from "node-dir";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";
import tmp from "tmp";
import webpack from "webpack";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dts = require("dts-bundle");

tmp.setGracefulCleanup();

type Mode = "development" | "production"
const mode: Mode = process.env.NODE_ENV ? process.env.NODE_ENV as Mode : "production";

export type Logger = (...args: any[]) => any

export interface Dependencies { [name: string]: string }

export interface Config {
  entry: {
    [file: string]: Dependencies;
  };
  logger: (...args: any[]) => any;
  outDir: string;
}

const packSingle = async (file: string, outDirectory: string, deps: Dependencies, logger: Logger) => {
  const {name} = path.parse(file);
  const outDir = path.join(outDirectory, name);
  const declarationDir = path.join(outDir, "declarations");
  const tsconfig = {
    compilerOptions: {
      baseUrl: ".",
      declaration: true,
      declarationDir,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "node",
      noImplicitAny: false,
      outDir,
      preserveConstEnums: true,
      removeComments: false,
      sourceMap: true,
      target: "es2018"
    },
    files: [file]
  };

  // eslint-disable-next-line no-sync
  const tsconfigFile = tmp.fileSync({
    dir: process.cwd(),
    postfix: ".codesweets-tsconfig.json",
    prefix: "."
  });
  await fs.promises.writeFile(tsconfigFile.name, JSON.stringify(tsconfig, null, 2));

  const externals: webpack.ExternalsObjectElement = {};
  const dependencies = Object.entries(deps).map((pair) => ({name: pair[0], path: pair[1]}));

  for (const dep of dependencies) {
    externals[dep.path] = `__imports[${JSON.stringify(dep.name)}]`;
  }

  const compiler = webpack({
    devtool: mode === "development" ? "source-map" : false,
    entry: {
      [name]: file
    },
    externals,
    mode,
    module: {
      rules: [
        {
          exclude: /node_modules|bin|dist/u,
          loader: "ts-loader",
          options: {
            configFile: tsconfigFile.name
          },
          test: /\.tsx?$/u
        }
      ]
    },
    node: {
      Buffer: true,
      __dirname: true,
      __filename: true,
      child_process: "empty",
      dns: "mock",
      fs: "empty",
      fsevents: true,
      global: true,
      inspector: true,
      module: "empty",
      net: "mock",
      os: true,
      process: true,
      tls: "mock"
    },
    output: {
      filename: `${name}.js`,
      library: name,
      libraryTarget: "var",
      path: outDir
    },
    performance: {
      hints: false
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify(mode)
        }
      })
    ],
    resolve: {
      extensions: [
        ".tsx",
        ".ts",
        ".js"
      ]
    },
    resolveLoader: {
      modules: [
        "node_modules",
        __dirname,
        path.resolve(__dirname, "../node_modules")
      ]
    },
    target: "web"
  });

  const result = await new Promise((resolve, reject) => compiler.run((err: Error, stats: webpack.Stats) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(stats);
  }));

  try {
    let final = "var __imports = {}\n";
    final += dependencies.map((dep, index) => "" +
      `import __import${index} from ${JSON.stringify(`../${dep.name}/${dep.name}.js`)};\n` +
      `__imports[${JSON.stringify(dep.name)}] = __import${index};\n`).join("");
    const jsPath = path.join(outDir, `${name}.js`);
    final += await fs.promises.readFile(jsPath, "utf8");
    final += `\nexport default ${name};`;
    await fs.promises.writeFile(jsPath, final, "utf8");

    const declFiles = await dir.promiseFiles(declarationDir);
    const declFileName = `${name}.d.ts`;
    const baseDeclFile = declFiles.find((declFile) => path.basename(declFile) === declFileName);
    if (baseDeclFile) {
      dts.bundle({
        baseDir: declarationDir,
        main: baseDeclFile,
        name,
        out: path.join(outDir, declFileName),
        outputAsModuleFolder: true
      });
    }
  } catch (err) {
    logger(err);
  }

  await new Promise((resolve) => rimraf(declarationDir, resolve));
  return result;
};

export default async (config: Config) => {
  const logger = config.logger || console.log;
  const outDir = path.resolve(config.outDir || "bin");
  const entries = Object.entries(config.entry);
  const results = await Promise.all(entries.map((pair) => packSingle(pair[0], outDir, pair[1], logger)));
  results.forEach((result) => {
    logger(`\n${"-".repeat(80)}`);
    logger(result.toString());
  });
};
