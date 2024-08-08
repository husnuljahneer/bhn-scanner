import fs from "fs";
import path from "path";
import { traverseDirectory } from "./traverseDirectory.js";
import { analyzeFileUsage } from "./analyzeFileUsage.js";

export async function analyzeProjectDependencies(projectFolder) {
  const packageJsonPath = path.join(projectFolder, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const dependencies = packageJson.dependencies || {};

  let dependencyUsage = new Map();

  for (const dependency of Object.keys(dependencies)) {
    dependencyUsage.set(dependency, {
      used: false,
      usedInFiles: [],
      usedFunctions: new Set()
    });
  }

  await traverseDirectory(projectFolder, dependencyUsage, dependencies);
  return dependencyUsage;
}
