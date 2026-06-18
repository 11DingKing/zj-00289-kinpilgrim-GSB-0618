const fs = require("fs");
const path = require("path");

const routesDir = path.join(__dirname, "..", "routes");
const files = fs.readdirSync(routesDir).filter((f) => f.endsWith(".ts"));

files.forEach((file) => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, "utf8");

  if (!content.includes('import db from "../database"')) {
    console.log(`Skipping ${file} - no db import`);
    return;
  }

  content = content.replace(
    'import db from "../database"',
    'import { getDb } from "../database"',
  );

  const routerMethodRegex = /router\.(get|post|put|delete)\([^)]+,\s*\(\s*req[^)]*\)\s*=>\s*\{/g;
  let match;
  const matches = [];
  while ((match = routerMethodRegex.exec(content)) !== null) {
    matches.push({
      index: match.index + match[0].length,
      length: 0,
    });
  }

  for (let i = matches.length - 1; i >= 0; i--) {
    const pos = matches[i].index;
    content = content.slice(0, pos) + "\n  const db = getDb();" + content.slice(pos);
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Fixed ${file}`);
});

console.log("Done!");
