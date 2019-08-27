set -e
eslint --ext .ts .
rm -rf ./bin
tsc
webpack
chmod +x ./bin/cli.js