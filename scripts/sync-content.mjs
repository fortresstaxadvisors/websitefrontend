import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.resolve(siteRoot, "..", "04-copy");
const mirrorRoot = path.join(siteRoot, "content", "04-copy");
const requiredDirs = ["core-site", "archive"];

function hasRequiredContent(root) {
  return requiredDirs.every((dir) => fs.existsSync(path.join(root, dir)));
}

if (!hasRequiredContent(sourceRoot)) {
  if (hasRequiredContent(mirrorRoot)) {
    console.log("No ../04-copy source found; using existing site/content mirror.");
    process.exit(0);
  }

  console.error(
    [
      "Missing Fortress content.",
      `Expected source content at ${sourceRoot}.`,
      `No deploy mirror exists at ${mirrorRoot}.`,
    ].join(" ")
  );
  process.exit(1);
}

fs.mkdirSync(mirrorRoot, { recursive: true });

for (const dir of requiredDirs) {
  const source = path.join(sourceRoot, dir);
  const destination = path.join(mirrorRoot, dir);
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
}

console.log(`Synced Fortress content mirror to ${mirrorRoot}.`);
