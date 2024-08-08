import fs from "fs";
import path from "path";

export async function listFiles(projectFolder, dependencyUsage, packageInfo) {
  const filePath = path.join(projectFolder, "dependency-analysis.txt");
  try {
    let currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    let content = `Dependency Analysis Report - ${currentDate}\n`;
    content += "=========================\n";

    for (const [dependency, usageInfo] of dependencyUsage.entries()) {
      console.log(`Dependency: ${dependency}`);
      console.log(`Used: ${usageInfo.used ? "Yes" : "No"}`);
      const fileList = usageInfo.usedInFiles
        .map((filePath) => path.basename(filePath))
        .sort()
        .map((fileName, index) => `${index + 1}. ${fileName}`)
        .join("\n");
      console.log(`Files:\n${fileList}`);
      console.log(
        `Functions: ${Array.from(usageInfo.usedFunctions).join(", ")}`
      );
      console.log("--------------------------------");
    }

    for (const [dependency, usageInfo] of dependencyUsage.entries()) {
      content += `Dependency: ${dependency}\n`;
      content += `Used: ${usageInfo.used ? "Yes" : "No"}\n`;
      const fileList = usageInfo.usedInFiles
        .map((filePath) => path.basename(filePath))
        .sort()
        .map((fileName, index) => `${index + 1}. ${fileName}`)
        .join("\n");
      content += `Files:\n${fileList}\n`;
      content += `Functions: ${Array.from(usageInfo.usedFunctions).join(
        ", "
      )}\n`;
      content += "--------------------------------\n";
    }

    content += "\nPackage Information:\n";
    content +=
      "Package | Current Version | Latest Version | Outdated | Node Compatibility | Used in Code\n";
    packageInfo.forEach((pkg) => {
      content += `${pkg.name} | ${pkg.currentVersion} | ${
        pkg.latestVersion
      } | ${pkg.outdated ? "Yes" : "No"} | ${pkg.nodeCompatibility} | ${
        pkg.usedInProject ? "Yes" : "No"
      }\n`;
    });

    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    console.log(
      "-----------------------------------------------------------------------------------------------------------------"
    );
    console.log(
      `|  Dependency analysis report has been saved to ${filePath} |`
    );
    console.log(
      "-----------------------------------------------------------------------------------------------------------------"
    );
  } catch (error) {
    console.error("Failed to generate or save the dependency report:", error);
  }
}
