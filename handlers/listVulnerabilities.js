import { execSync } from "child_process";

export function listVulnerabilities(projectFolder) {
  console.log("Checking for vulnerabilities...");
  try {
    const auditResult = execSync("npm audit", {
      cwd: projectFolder,
      stdio: "inherit"
    });
    console.log(auditResult.toString());
  } catch (error) {
    if (error.stdout) {
      console.log(error.stdout.toString());
    }
    if (error.stderr) {
      console.log(error.stderr.toString());
    }
  }
}
