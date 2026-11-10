// Read a YAML file as JSON under Node, which has no YAML parser of its
// own: Ruby, which Jekyll needs anyway, parses it and prints JSON. The
// data carries bare dates (an mcs block's `read`, a source's `accessed`)
// and anchors, which Ruby's safe loader refuses unless they are allowed
// by name; a date comes out as its ISO string. tools/check-foods.py
// loads the same way.
"use strict";
const { execFileSync } = require("child_process");

const RUBY = "puts JSON.dump(YAML.load_file(ARGV[0], permitted_classes: [Date], aliases: true))";

function loadYaml(file) {
  const out = execFileSync("ruby", ["-ryaml", "-rjson", "-rdate", "-e", RUBY, file],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out);
}

module.exports = { loadYaml };
