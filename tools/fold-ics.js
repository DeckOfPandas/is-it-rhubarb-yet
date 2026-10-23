// Fold the built calendar feeds as RFC 5545 asks: every line ends in
// CRLF and no line is longer than 75 octets, a longer one continued on
// the next line after a single space, split between characters, never
// inside one. Jekyll writes LF and leaves a long DESCRIPTION whole;
// calendar apps forgive both, but a validator does not. Run after the
// Jekyll build; tools/build.sh and the deploy do.
//
// usage: node tools/fold-ics.js [<site dir>]   (default _site)
"use strict";
const fs = require("fs");
const path = require("path");

const LIMIT = 75;

// One content line as folded lines, each at most LIMIT octets of UTF-8.
function fold(line) {
  const out = [];
  let rest = line;
  let room = LIMIT;
  while (Buffer.byteLength(rest) > room) {
    let cut = 0, bytes = 0;
    for (const ch of rest) {
      const b = Buffer.byteLength(ch);
      if (bytes + b > room) break;
      bytes += b;
      cut += ch.length;
    }
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
    room = LIMIT;
  }
  out.push(rest);
  return out;
}

function foldFile(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const lines = [];
  for (const line of text.split("\n")) {
    if (line === "" ) continue;
    for (const l of fold(line)) lines.push(l);
  }
  fs.writeFileSync(file, lines.join("\r\n") + "\r\n");
  return lines.length;
}

function icsFiles(dir) {
  return fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith(".ics")).map((f) => path.join(dir, f));
}

if (require.main === module) {
  const dir = process.argv[2] || "_site";
  const files = icsFiles(dir);
  let lines = 0;
  for (const f of files) lines += foldFile(f);
  console.log("folded " + files.length + " calendar feeds, " + lines + " lines, in " + dir);
}

module.exports = { fold, foldFile, icsFiles, LIMIT };
