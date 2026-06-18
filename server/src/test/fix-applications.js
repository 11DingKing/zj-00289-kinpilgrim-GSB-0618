const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "routes", "applications.ts");
let content = fs.readFileSync(filePath, "utf8");

const lines = content.split("\n");
const result = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  result.push(line);

  if (line.match(/router\.(get|post|put|delete)\(/)) {
    const nextLine = lines[i + 1] || "";
    if (!nextLine.includes("const db = getDb()")) {
      result.push("  const db = getDb();");
    }
  }
}

content = result.join("\n");
fs.writeFileSync(filePath, content, "utf8");
console.log("Fixed applications.ts");
