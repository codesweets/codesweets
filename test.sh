set -e
cd test
rm -rf ./bin
../bin/cli.js build
../bin/cli.js run --script=./bin/test-imports.js