import { execSync } from "child_process";
import path from "path";

export function findPackageUsageInProject(packageName, projectFolder) {
  const grepCommand = process.platform === "win32" ? "findstr /s" : "grep -rl";
  const importPattern = `require\\(\\'${packageName}\\'\\)|import.*\\'${packageName}\\'|require\\("${packageName}"\\)|import.*"${packageName}"`;

  try {
    const usageResults = execSync(
      `${grepCommand} "${importPattern}" ${path.join(projectFolder, "src")}`,
      { stdio: "pipe" }
    ).toString();
    if (usageResults) {
      console.log(`Package ${packageName} is used in the following files:`);
      console.log(usageResults);
    } else {
      console.log(`No usage of package ${packageName} found.`);
    }
  } catch (error) {
    console.log(`Error searching for package usage: ${error.message}`);
  }
}
