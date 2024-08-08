import { execSync } from "child_process";

export function installPackageAndHandleFailure(
  packageName,
  branchName,
  projectFolder
) {
  try {
    execSync(`git checkout main`, { cwd: projectFolder, stdio: "inherit" });

    try {
      execSync(`git branch -D ${branchName}`, {
        cwd: projectFolder,
        stdio: "inherit"
      });
      console.log(`Existing branch ${branchName} deleted.`);
    } catch (error) {
      console.log(
        `Branch ${branchName} does not exist or could not be deleted. Error: ${error.message}`
      );
    }

    execSync(`git checkout -b ${branchName}`, {
      cwd: projectFolder,
      stdio: "inherit"
    });

    execSync(`npm install ${packageName}@latest`, {
      cwd: projectFolder,
      stdio: "inherit"
    });
    console.log(
      `Successfully installed ${packageName} on branch ${branchName}.`
    );
  } catch (error) {
    console.error(`Failed to install ${packageName}. Error: ${error.message}`);
  }
}
