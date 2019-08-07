set -e
eslint --ext .ts .
rm -rf ./bin
tsc
chmod +x ./bin/cli.js