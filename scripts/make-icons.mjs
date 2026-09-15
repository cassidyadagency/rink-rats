import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  await sharp("public/icon.svg").resize(size, size).png().toFile(`public/icons/${name}`);
  console.log("wrote", name);
}
