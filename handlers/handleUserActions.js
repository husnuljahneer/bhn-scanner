import inquirer from "inquirer";
import { execSync } from "child_process";
import { listFiles } from "./listFiles.js";
import { updatePackageInteraction } from "./updatePackageInteraction.js";
import { runCustomCommand } from "./runCustomCommand.js";
import { showDeprecationDetails } from "./showDeprecationDetails.js";
import { initializePackageInfo } from "./initializePackageInfo.js";
import { enrichAllPackageInfo } from "./enrichAllPackageInfo.js";
import { analyzeProjectDependencies } from "./analyzeProjectDependencies.js";
import { listVulnerabilities } from "./listVulnerabilities.js";
export async function handleUserActions(packageInfo, projectFolder) {
  let isRunning = true;
  const dependencyUsage = await analyzeProjectDependencies(projectFolder);

  while (isRunning) {
    const { updateOption } = await inquirer.prompt([
      {
        type: "list",
        name: "updateOption",
        message:
          "Welcome to Pepper-Scan. As a token of our appreciation, please enjoy this virtual candy 🍭. Select an option below to continue. 💭",
        choices: [
          { name: "List the files [ Download as Report ]", value: "listFiles" },
          { name: "Update a Package", value: "update" },
          { name: "List Vulnerabilities", value: "listVulnerabilities" },
          { name: "Show Deprecated Packages", value: "showDeprecation" },
          { name: "Go back to Main Menu", value: "goBackToMainMenu" },
          { name: "Execute Custom NPM Command", value: "runCustomCommand" },
          { name: "Clear Console", value: "clearConsole" },
          { name: "Exit", value: "exit" }
        ]
      }
    ]);

    switch (updateOption) {
      case "listFiles":
        await listFiles(projectFolder, dependencyUsage, packageInfo);
        await analyzeProjectDependencies(projectFolder).catch(console.error);
        break;
      case "update":
        await updatePackageInteraction(packageInfo, projectFolder);
        break;
      case "listVulnerabilities":
        console.log("👾 Loading the command..");
        listVulnerabilities(projectFolder);
        break;
      case "showDeprecation":
        showDeprecationDetails(packageInfo);
        break;
      case "goBackToMainMenu":
        console.log("🚀 Main menu Loading...");
        const refreshedPackageInfo = await initializePackageInfo(projectFolder);
        const enrichedRefreshedPackageInfo = await enrichAllPackageInfo(
          refreshedPackageInfo,
          projectFolder,
          process.version
        );
        displayPackageInfo(enrichedRefreshedPackageInfo);
        console.log("Press any key to return to the main menu...");
        await main();
        break;
      case "runCustomCommand":
        await runCustomCommand(projectFolder);
        break;
      case "clearConsole":
        console.clear();
        break;
      case "exit":
        console.log("Exiting... 👋🏼");
        isRunning = false;
        break;
    }
  }
}
