import { readFile } from "node:fs/promises";

const schema = JSON.parse(await readFile(new URL("../results.schema.json", import.meta.url), "utf8"));
const document = JSON.parse(await readFile(new URL("../results/benchmark-records.json", import.meta.url), "utf8"));

function resolveRef(ref) {
  if (!ref.startsWith("#/")) throw new Error(`Unsupported external schema reference: ${ref}`);
  return ref.slice(2).split("/").reduce((value, key) => value[key.replaceAll("~1", "/").replaceAll("~0", "~")], schema);
}

function typeMatches(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return typeof value === type;
}

function validate(value, rule, path = "record") {
  if (rule.$ref) return validate(value, resolveRef(rule.$ref), path);
  if (rule.anyOf) {
    const failures = [];
    for (const candidate of rule.anyOf) {
      try { validate(value, candidate, path); return; } catch (error) { failures.push(error.message); }
    }
    throw new Error(`${path} does not match any allowed schema: ${failures.join(" | ")}`);
  }
  if (Object.hasOwn(rule, "const") && value !== rule.const) throw new Error(`${path} must equal ${JSON.stringify(rule.const)}`);
  if (rule.enum && !rule.enum.includes(value)) throw new Error(`${path} must be one of ${rule.enum.join(", ")}`);
  if (rule.type) {
    const types = Array.isArray(rule.type) ? rule.type : [rule.type];
    if (!types.some((type) => typeMatches(value, type))) throw new Error(`${path} has invalid type`);
  }
  if (typeof value === "string") {
    if (rule.minLength != null && value.length < rule.minLength) throw new Error(`${path} is too short`);
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) throw new Error(`${path} does not match ${rule.pattern}`);
    if (rule.format === "date-time" && Number.isNaN(Date.parse(value))) throw new Error(`${path} is not a date-time`);
    if (rule.format === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${path} is not a date`);
    if (rule.format === "uri") { try { new URL(value); } catch { throw new Error(`${path} is not a URI`); } }
  }
  if (typeof value === "number") {
    if (rule.minimum != null && value < rule.minimum) throw new Error(`${path} is below minimum`);
    if (rule.exclusiveMinimum != null && value <= rule.exclusiveMinimum) throw new Error(`${path} is below exclusive minimum`);
  }
  if (Array.isArray(value)) {
    if (rule.minItems != null && value.length < rule.minItems) throw new Error(`${path} has too few items`);
    if (rule.items) value.forEach((item, index) => validate(item, rule.items, `${path}[${index}]`));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of rule.required || []) if (!Object.hasOwn(value, key)) throw new Error(`${path}.${key} is required`);
    if (rule.additionalProperties === false) {
      const allowed = new Set(Object.keys(rule.properties || {}));
      for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`${path}.${key} is not allowed`);
    }
    for (const [key, childRule] of Object.entries(rule.properties || {})) if (Object.hasOwn(value, key)) validate(value[key], childRule, `${path}.${key}`);
  }
}

if (document.schemaVersion !== 1 || !Array.isArray(document.records)) throw new Error("Benchmark record document wrapper is invalid.");
if (document.records.length !== 54) throw new Error(`Expected 54 benchmark records, found ${document.records.length}.`);
document.records.forEach((record, index) => validate(record, schema, `records[${index}]`));
console.log(`Validated ${document.records.length} records against results.schema.json.`);
