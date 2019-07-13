set -e
cd test
rm -rf ./bin
../bin/codesweets-cli.js
node ./bin/test-node.js
node ./bin/test-web.js