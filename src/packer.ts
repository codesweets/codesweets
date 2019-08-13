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

const packSingle = async (file: string, outDir: string, deps: Dependencies) => {
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
      }
    })
  ];

  const externals: webpack.ExternalsObjectElement = {};
  const dependencies = Object.entries(deps).map((pair) => ({name: pair[0], path: pair[1]}));

  for (const dep of dependencies) {
    externals[dep.path] = `commonjs2 /${dep.name}`;
  }

  const filename = `${name}.js`;
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
      global: true,
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
      libraryTarget: "var",
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

  return result;
};

export default async (config: Config) => {
  const logger = config.logger || console.log;
  const outDir = path.resolve(config.outDir || "bin");
  const entries = Object.entries(config.entry);
  const results = await Promise.all(entries.map((pair) => packSingle(pair[0], outDir, pair[1])));
  results.forEach((stats: webpack.Stats) => {
    logger(`\n${"-".repeat(80)}`);
    logger(stats.toString());
  });
};
