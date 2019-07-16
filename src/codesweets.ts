import fs from "fs";
import path from "path";
import tmp from "tmp";
import webpack from "webpack";

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

export type Target = "web" | "node"

const packSingle = async (file: string, outDir: string, deps: Dependencies, target: Target, logger: Logger) => {
  const {name} = path.parse(file);

  await fs.promises.mkdir(outDir, {recursive: true});

  const tsconfig = {
    compilerOptions: {
      baseUrl: ".",
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
    files: [path.relative(outDir, file)]
  };

  // eslint-disable-next-line no-sync
  const tsconfigFile = tmp.fileSync({
    dir: outDir,
    postfix: ".codesweets-tsconfig.json",
    prefix: "."
  }).name;
  await fs.promises.writeFile(tsconfigFile, JSON.stringify(tsconfig, null, 2));

  const alias = {
    bfsGlobal: require.resolve("browserfs"),
    buffer: "browserfs/dist/shims/buffer.js",
    bufferGlobal: "browserfs/dist/shims/bufferGlobal.js",
    fs: "browserfs/dist/shims/fs.js",
    path: "browserfs/dist/shims/path.js",
    processGlobal: require.resolve("browserfs/dist/shims/process.js")
  };

  const plugins = [
    new webpack.ProvidePlugin({
      BrowserFS: "bfsGlobal",
      Buffer: "bufferGlobal",
      process: "processGlobal"
    }),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(mode)
      },
      "window": "(typeof window !== 'undefined' && window || global)"
    })
  ];

  const externals: webpack.ExternalsObjectElement = {};
  const dependencies = Object.entries(deps).map((pair) => ({name: pair[0], path: pair[1]}));

  const libraryTarget = target === "node" ? "commonjs2" : "var";
  for (const dep of dependencies) {
    externals[dep.path] = target === "node"
      ? `commonjs2 ${dep.path}`
      : `__imports[${JSON.stringify(dep.name)}]`;
  }

  const filename = `${name}-${target}.js`;
  const compiler = webpack({
    devtool: mode === "development" ? "source-map" : false,
    entry: {
      [name]: file
    },
    externals,
    mode,
    module: {
      noParse: /browserfs\.js/u,
      rules: [
        {
          exclude: /node_modules|bin|dist/u,
          loader: "ts-loader",
          options: {
            configFile: tsconfigFile
          },
          test: /\.tsx?$/u
        }
      ]
    },
    node: {
      Buffer: false,
      __dirname: true,
      __filename: true,
      child_process: "empty",
      dns: "mock",
      fs: false,
      fsevents: true,
      global: false,
      inspector: true,
      module: "empty",
      net: "mock",
      os: true,
      path: false,
      process: false,
      tls: "mock"
    },
    output: {
      filename,
      library: name,
      libraryTarget,
      path: outDir
    },
    performance: {
      hints: false
    },
    plugins,
    resolve: {
      alias,
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

  const result = await new Promise<webpack.Stats>((resolve, reject) => compiler.run((err, stats) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(stats);
  }));

  if (target === "web") {
    try {
      let final = "var __imports = {}\n";
      final += dependencies.map((dep, index) => "" +
      `import __import${index} from ${JSON.stringify(`/${dep.name}`)};\n` +
      `__imports[${JSON.stringify(dep.name)}] = __import${index};\n`).join("");
      final += await fs.promises.readFile(path.join(outDir, filename), "utf8");
      final += `\nexport default ${name};`;
      await fs.promises.writeFile(path.join(outDir, `${name}-${target}-imports.js`), final, "utf8");
    } catch (err) {
      logger(err);
    }
  }
  return result;
};

export default async (config: Config) => {
  const logger = config.logger || console.log;
  const outDir = path.resolve(config.outDir || "bin");
  const entries = Object.entries(config.entry);
  const targets = [
    "web",
    "node"
  ];
  // eslint-disable-next-line max-len
  const results = await Promise.all(targets.map(async (target: Target) => Promise.all(entries.map((pair) => packSingle(pair[0], outDir, pair[1], target, logger)))));
  [].concat(...results).forEach((stats: webpack.Stats) => {
    logger(`\n${"-".repeat(80)}`);
    logger(stats.toString());
  });
};
