// Every built page's share image exists at the size its og:image:width
// and og:image:height state, read from the file's own header.
//
// usage: node --test tests/cards/   (after sh tools/build.sh)
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const SITE = path.resolve(__dirname, "..", "..", "_site");

// Width and height from a PNG's IHDR or a JPEG's start-of-frame marker.
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let at = 2;
    while (at < b.length) {
      const marker = b[at + 1];
      const len = b.readUInt16BE(at + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: b.readUInt16BE(at + 7), height: b.readUInt16BE(at + 5) };
      }
      at += 2 + len;
    }
  }
  throw new Error(file + " is not a PNG or JPEG with a size in its header");
}

function meta(html, prop) {
  const m = html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`));
  return m && m[1];
}

// A site URL's file in _site: what follows the baseurl, which the build
// may set to anything, so it is found by the first path segment after it.
function siteFile(url, firstSegment) {
  const at = url.indexOf("/" + firstSegment + "/");
  return at < 0 ? null : path.join(SITE, url.slice(at + 1));
}

function pages() {
  return fs.readdirSync(SITE, { recursive: true }).filter((f) => f.endsWith(".html")).map((f) => path.join(SITE, f));
}

test("the site has been built", () => {
  assert.ok(fs.existsSync(path.join(SITE, "cards")), "no _site/cards: run sh tools/build.sh first");
});

test("every page's share image is the size the page states", () => {
  const all = pages();
  assert.ok(all.length > 100, `only ${all.length} pages in _site`);
  const wrong = [];
  for (const page of all) {
    const html = fs.readFileSync(page, "utf8");
    const url = meta(html, "og:image");
    if (!url) continue;
    const file = siteFile(url, "cards");
    const rel = path.relative(SITE, page);
    if (!file || !fs.existsSync(file)) { wrong.push(`${rel}: ${url} is not in _site`); continue; }
    const size = imageSize(file);
    const stated = { width: Number(meta(html, "og:image:width")), height: Number(meta(html, "og:image:height")) };
    if (size.width !== stated.width || size.height !== stated.height) {
      wrong.push(`${rel}: ${path.basename(file)} is ${size.width}x${size.height}, the page says ${stated.width}x${stated.height}`);
    }
    if (meta(html, "twitter:image") !== url) wrong.push(`${rel}: twitter:image is not og:image`);
  }
  assert.deepStrictEqual(wrong, []);
});
