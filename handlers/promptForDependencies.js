import inquirer from "inquirer";

export async function promptForDependencies(packageInfo) {
  const { includeSpecificDependencies } = await inquirer.prompt([
    {
      type: "confirm",
      name: "includeSpecificDependencies",
      message: "Would you like to include specific dependencies in the check?",
      default: false
    }
  ]);

  let filteredPackageInfo = packageInfo;

  if (includeSpecificDependencies) {
    const dependencyNames = packageInfo.map((pkg) => pkg.name);
    const { selectedDependencies } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedDependencies",
        message: "Select the dependencies you want to include in the check:",
        choices: dependencyNames
      }
    ]);
    filteredPackageInfo = packageInfo.filter((pkg) =>
      selectedDependencies.includes(pkg.name)
    );
  }

  return { filteredPackageInfo };
}
