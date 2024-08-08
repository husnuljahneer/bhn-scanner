import fs from "fs";
import path from "path";

export const globalImports = async (projectFolder) => {
  const globalsPath = path.join(projectFolder, "../config/globals.js");
  if (!fs.existsSync(globalsPath)) {
    return [];
  }
  const fileContents = fs.readFileSync(globalsPath, "utf8");
  const regex =
    /^\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s*:\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)(?![^\/]*\*\/)/gm;
  let globalPackages = [];
  let match;
  while ((match = regex.exec(fileContents)) !== null) {
    globalPackages.push({
      registerd_npm_name: match[2],
      renamed_npm_name: match[1]
    });
  }
  return globalPackages;
};
