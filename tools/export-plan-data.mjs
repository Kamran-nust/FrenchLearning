// Copies the 301-day plan data from the web app (the single source of truth)
// into the Android and iPhone projects as plain JSON files:
//   node tools/export-plan-data.mjs
// Run it again whenever frontend/src/data/*.js changes.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = { anki: "ankiDays", grammar: "grammarDays", kwiziq: "kwiziqDays", tv5: "tv5Days", writing: "writingDays" };
const targets = [
  path.join(root, "android/app/src/main/assets/plan"),
  path.join(root, "ios/FrenchNCLC7/Resources/plan"),
];

for (const dir of targets) fs.mkdirSync(dir, { recursive: true });
for (const [name, file] of Object.entries(sources)) {
  const text = fs.readFileSync(path.join(root, "frontend/src/data", file + ".js"), "utf8");
  const json = text.slice(text.indexOf("=") + 1).trim().replace(/;$/, "");
  const parsed = JSON.parse(json); // fails loudly if the file's shape ever changes
  if (parsed.length !== 301) throw new Error(name + ": expected 301 days, got " + parsed.length);
  for (const dir of targets) fs.writeFileSync(path.join(dir, name + ".json"), JSON.stringify(parsed));
  console.log(name + ": " + parsed.length + " days");
}
