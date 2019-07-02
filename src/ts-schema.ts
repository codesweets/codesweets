import * as TJS from "typescript-json-schema";
import titleCase from "title-case";
import traverse from "traverse";
import webpack from "webpack";

const settings: TJS.PartialArgs = {
  excludePrivate: true,
  ignoreErrors: true,
  ref: false,
  required: true,
  titles: true
};

export default function (this: webpack.loader.LoaderContext) {
  const schemaRegex = /(?<tsFile>.*)\?(?<type>.*)/gu;
  // eslint-disable-next-line no-invalid-this
  const result = schemaRegex.exec(this.resource);
  if (!result) {
    throw Error("When using ts-schema the format is require('ts-schema!./your-file.ts?YourType')'");
  }

  const program = TJS.getProgramFromFiles([result.groups.tsFile]);
  const schema = TJS.generateSchema(program, result.groups.type, settings);
  traverse(schema).forEach((node) => {
    if (node.title) {
      node.title = titleCase(node.title);
    }
  });
  return `module.exports = ${JSON.stringify(schema, null, 2)}`;
}
