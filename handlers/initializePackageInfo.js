import path from "path";
import fs from "fs";

export async function initializePackageInfo(
  projectFolder,
  checkDevDependencies
) {
  const packageJsonPath = path.join(projectFolder, "package.json");
  const packageJsonData = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonData);

  const dependencies = checkDevDependencies
    ? packageJson.devDependencies
    : packageJson.dependencies;

  return Object.entries(dependencies || {}).map(([name, version]) => ({
    name,
    currentVersion: version.replace(/[^\d.]/g, ""),
    latestVersion: "",
    outdated: false,
    deprecated: "",
    usedInProject: false,
    nodeCompatibility: ""
  }));
}
