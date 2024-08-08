#!/usr/bin/env node

import inquirer from "inquirer";
import { initializePackageInfo } from "./handlers/initializePackageInfo.js";
import { enrichAllPackageInfo } from "./handlers/enrichAllPackageInfo.js";
import { displayPackageInfo } from "./handlers/displayPackageInfo.js";
import { handleUserActions } from "./handlers/handleUserActions.js";
import { promptForDependencies } from "./handlers/promptForDependencies.js";

const projectFolder = `/Users/husnuljahneer/Projects/grocerella/`;

console.log("Script loading.. Please wait.. ");

async function main() {
  try {
    const { projectFolderPath } = await inquirer.prompt([
      {
        type: "input",
        name: "projectFolderPath",
        default: () => projectFolder,
        message:
          "Enter the path to your project folder or press Enter for the default path",
        validate: function (value) {
          var pass = value.match(/^[^\0]+$/i);
          if (pass) {
            return true;
          }

          return "Please enter a valid folder path";
        }
      }
    ]);

    console.log("Script loading.. Please wait.. ");
    console.log(`Scanning.. ${projectFolderPath}`);

    const { customNodeVersion } = await inquirer.prompt([
      {
        type: "input",
        name: "customNodeVersion",
        message:
          "Enter a Node.js version to check against or press Enter to use the current version:",
        default: () => process.version,
        validate: function (value) {
          // Optionally add more validation logic here
          return true;
        }
      }
    ]);

    const nodeVersionToCheck = customNodeVersion || process.version;
    console.log(`Node.js version to check against: ${nodeVersionToCheck}`);

    const { dependencyType } = await inquirer.prompt([
      {
        type: "list",
        name: "dependencyType",
        message: "Select the type of dependencies to check:",
        choices: [
          { name: "Dependencies (production)", value: false },
          { name: "DevDependencies (development)", value: true }
        ]
      }
    ]);

    const packageInfo = await initializePackageInfo(
      projectFolderPath,
      dependencyType
    );

    let filteredPackageInfo = packageInfo;

    if (!dependencyType) {
      const additionalPrompts = await promptForDependencies(packageInfo);
      filteredPackageInfo = additionalPrompts.filteredPackageInfo;
    }

    const enrichedPackageInfo = await enrichAllPackageInfo(
      filteredPackageInfo,
      projectFolderPath,
      nodeVersionToCheck
    );

    await displayPackageInfo(enrichedPackageInfo);
    await handleUserActions(enrichedPackageInfo, projectFolderPath);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
