import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(__dirname);
const banned = [/from\s+["']react["']/, /from\s+["']next/, /from\s+["']dexie/, /\bwindow\b/, /\bdocument\b/, /\bnavigator\b/];

describe("domain purity", () => {
  it("has no React, Next, Dexie, or browser-global references", () => {
    const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    for (const f of files) {
      const src = readFileSync(join(dir, f), "utf8");
      for (const re of banned) {
        expect(src, `${f} matches ${re}`).not.toMatch(re);
      }
    }
  });
});
