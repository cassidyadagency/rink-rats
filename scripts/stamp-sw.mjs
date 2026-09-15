import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = readFileSync("sw/sw.js", "utf8");
const buildId = Date.now().toString(36);
const stamped = src.replace("__BUILD_ID__", buildId);

mkdirSync("public", { recursive: true });
writeFileSync("public/sw.js", stamped);
console.log("stamped public/sw.js with build id", buildId);
