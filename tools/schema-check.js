// A JSON Schema validator for the keywords the season schema uses and no
// others. A schema naming any keyword not handled here is refused outright,
// so an edit to the schema can never be silently ignored by this check:
// support the keyword here first. No dependencies, as the site has no npm.
//
// usage: const { validate } = require("./schema-check.js");
//        validate(schema, data)  -> a list of problems, empty when valid
"use strict";

const ANNOTATIONS = new Set(["$schema", "$id", "title", "description"]);
const KEYWORDS = new Set(["type", "required", "properties", "additionalProperties",
  "items", "const", "enum", "minItems", "maxItems", "minLength", "pattern"]);

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  return typeof v;
}

function sameJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// Every keyword in the schema, at every depth, must be one this file handles.
function checkSchema(schema, where) {
  const problems = [];
  for (const key of Object.keys(schema)) {
    if (ANNOTATIONS.has(key)) continue;
    if (!KEYWORDS.has(key)) problems.push(`${where}: schema keyword "${key}" is not supported by tools/schema-check.js`);
  }
  if (schema.additionalProperties !== undefined && schema.additionalProperties !== false) {
    problems.push(`${where}: only "additionalProperties": false is supported`);
  }
  for (const [name, sub] of Object.entries(schema.properties || {})) problems.push(...checkSchema(sub, `${where}.properties.${name}`));
  if (schema.items) problems.push(...checkSchema(schema.items, `${where}.items`));
  return problems;
}

function check(schema, data, at, out) {
  if (schema.const !== undefined && !sameJson(schema.const, data)) out.push(`${at}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some((e) => sameJson(e, data))) out.push(`${at}: ${JSON.stringify(data)} is not one of ${schema.enum.join(", ")}`);
  if (schema.type) {
    const t = typeOf(data);
    const ok = t === schema.type || (schema.type === "number" && t === "integer");
    if (!ok) { out.push(`${at}: must be ${schema.type}, is ${t}`); return; }
  }
  if (typeof data === "string") {
    if (schema.minLength !== undefined && data.length < schema.minLength) out.push(`${at}: shorter than ${schema.minLength}`);
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(data)) out.push(`${at}: ${JSON.stringify(data)} does not match ${schema.pattern}`);
  }
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) out.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.maxItems !== undefined && data.length > schema.maxItems) out.push(`${at}: more than ${schema.maxItems} items`);
    if (schema.items) data.forEach((item, i) => check(schema.items, item, `${at}[${i}]`, out));
  }
  if (typeOf(data) === "object") {
    for (const key of schema.required || []) if (!(key in data)) out.push(`${at}: missing "${key}"`);
    const props = schema.properties || {};
    for (const [key, value] of Object.entries(data)) {
      if (props[key]) check(props[key], value, `${at}.${key}`, out);
      else if (schema.additionalProperties === false) out.push(`${at}: unexpected "${key}"`);
    }
  }
}

function validate(schema, data) {
  const refused = checkSchema(schema, "schema");
  if (refused.length) return refused;
  const out = [];
  check(schema, data, "$", out);
  return out;
}

module.exports = { validate };
