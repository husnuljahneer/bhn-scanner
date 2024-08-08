import { execSync } from "child_process";

export function checkPeerDependencies(packageName) {
  try {
    const output = execSync(
      `npm info ${packageName} peerDependencies --json`
    ).toString();
    console.log("Raw output:", output);

    if (!output) {
      console.warn(
        `❌ No peer dependencies found for ${packageName}, or no output from npm info.`
      );
      return;
    }

    const peerDependencies = JSON.parse(output);
    if (Object.keys(peerDependencies).length === 0) {
      console.log(`${packageName} does not have any peer dependencies.`);
      return;
    }

    console.log(`${packageName} requires the following peer dependencies:`);
    console.log(peerDependencies);

    Object.keys(peerDependencies).forEach((dep) => {
      try {
        execSync(`npm ls ${dep}`);
        console.log(`${dep} is already installed.`);
      } catch (error) {
        console.warn(
          `Missing peer dependency: ${dep}. Required version: ${peerDependencies[dep]}`
        );
      }
    });
  } catch (error) {
    console.error(
      `Failed to fetch peer dependencies for ${packageName}: ${error}`
    );
  }
}
