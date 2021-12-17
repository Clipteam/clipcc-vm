#!/usr/bin/env node

const fs = require('fs');

const args = process.argv.slice(2);

if (!args.length) {
    process.stdout.write('You must specify the messages file.\n');
    process.exit(1);
}

const INPUT_FILE = args.shift();

if (!args.length) {
    process.stdout.write('A destination file must be specified.\n');
    process.exit(1);
}

const OUTPUT_FILE = args.shift();

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
const result = {};

for (const key in data) {
    result[key] = data[key].message;
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');
