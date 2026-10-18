// Read a YAML file as JSON under Node, which has no YAML parser of its
// own: Ruby, which Jekyll needs anyway, parses it and prints JSON.
"use strict";
const { execFileSync } = require("child_process");

function loadYaml(file) {
  const out = execFileSync("ruby", [
    "-ryaml", "-rjson", "-e", "puts JSON.dump(YAML.load_file(ARGV[0]))", file
  ], { encoding: "utf8" });
  return JSON.parse(out);
}

module.exports = { loadYaml };
