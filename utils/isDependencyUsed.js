import fs from "fs";
import path from "path";

export function isDependencyUsed(projectFolder, dependencyName) {
  const filesAndDirsToIgnore = ["node_modules", ".git", "update_package.js"];
  let isUsed = false;

  const checkUsageInFile = (filePath, searchTerms) => {
    const content = fs.readFileSync(filePath, "utf8");
    return searchTerms.some((term) => content.includes(term));
  };

  const traverseDirectory = (dirPath) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (filesAndDirsToIgnore.includes(entry.name)) continue;
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        traverseDirectory(entryPath);
      } else if (
        entry.isFile() &&
        [".js", ".jsx", ".ts", ".tsx"].includes(path.extname(entry.name))
      ) {
        const searchTerms = [
          dependencyName,
          dependencyName.split("/").pop()
        ].filter(Boolean);
        if (checkUsageInFile(entryPath, searchTerms)) {
          isUsed = true;
          return;
        }
      }
    }
  };
  traverseDirectory(projectFolder);
  return isUsed;
}
