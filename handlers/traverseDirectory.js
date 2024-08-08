import fs from "fs";
import path from "path";
import { analyzeFileUsage } from "./analyzeFileUsage.js";

export async function traverseDirectory(dir, dependencyUsage, dependencies) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && !filePath.includes("node_modules")) {
      await traverseDirectory(filePath, dependencyUsage, dependencies);
    } else if (stats.isFile() && file.endsWith(".js")) {
      await analyzeFileUsage(filePath, dependencyUsage, dependencies);
    }
  }
}
