import inquirer from "inquirer";
import { execSync } from "child_process";
import { findPackageUsageInProject } from "./findPackageUsageInProject.js";

export async function updatePackageInteraction(packageInfo, projectFolder) {
  const { packageResponse } = await inquirer.prompt([
    {
      type: "input",
      name: "packageResponse",
      message:
        "Enter the number of the package you want to update, or type 'Exit' to go back:",
      validate: (input) => {
        if (
          input.toLowerCase() === "exit" ||
          (input >= 1 && input <= packageInfo.length)
        ) {
          return true;
        }
        return "Please enter a valid index or type 'Exit' to go back.";
      }
    }
  ]);

  if (packageResponse.toLowerCase() === "exit") {
    return;
  }

  const packageIndex = parseInt(packageResponse) - 1;
  const pkg = packageInfo[packageIndex];

  console.log(`Analyzing usage of package: ${pkg.name}`);
  findPackageUsageInProject(pkg.name, projectFolder);

  const confirmation = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceedUpdate",
      message: `Are you sure you want to update ${pkg.name} from version ${pkg.currentVersion} to ${pkg.latestVersion}?`,
      default: false
    }
  ]);

  if (!confirmation.proceedUpdate) {
    console.log("Update cancelled.");
    return;
  }

  console.log(`Updating ${pkg.name}...`);
  try {
    const updateCommand = `npm install ${pkg.name}@${pkg.latestVersion}`;
    execSync(updateCommand, { cwd: projectFolder, stdio: "inherit" });
    console.log(
      `${pkg.name} has been updated to version ${pkg.latestVersion}.`
    );
  } catch (error) {
    console.error(`Failed to update ${pkg.name}. Error: ${error.message}`);
  }
}
