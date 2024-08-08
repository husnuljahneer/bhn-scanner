import inquirer from "inquirer";
import { execSync } from "child_process";

export async function runCustomCommand(projectFolder) {
  const { customCommand } = await inquirer.prompt([
    {
      type: "input",
      name: "customCommand",
      message: 'Enter the npm command you want to run (e.g., "audit fix"):'
    }
  ]);

  console.log(`Running "npm ${customCommand}"...`);
  try {
    execSync(`npm ${customCommand}`, { cwd: projectFolder, stdio: "inherit" });
    console.log(`Command "npm ${customCommand}" executed successfully.`);
  } catch (error) {
    console.error(
      `Failed to execute "npm ${customCommand}". Error: ${error.message}`
    );
  }
}
