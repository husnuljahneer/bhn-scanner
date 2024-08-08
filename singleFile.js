import { execSync } from "child_process";
import inquirer from "inquirer";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import semver from "semver";

console.log("Script loading.. Please wait.. ");
const projectFolder =
  "C:\\Users\\Example";
function checkProjectFolder(folder) {
  if (!folder) {
    return "No Project Selected!  ";
  }
  return `Scanning.. ${projectFolder}`;
}
let globalIntiatedPackages = [];
console.log(checkProjectFolder(projectFolder));

const customNodeVersion = "";
const nodeVersionToCheck = customNodeVersion || process.version;

console.log(nodeVersionToCheck);

async function main() {
  try {
    const { projectFolderPath } = await inquirer.prompt([
      {
        type: "input",
        name: "projectFolderPath",
        default: () => projectFolder,
        message:
          "Enter the path to your project folder or Press enter for default path",
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
    globalIntiatedPackages = await globalImports(projectFolderPath);
    const customNodeVersion = "";
    const nodeVersionToCheck = customNodeVersion || process.version;

    console.log(nodeVersionToCheck);

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

    // Proceed based on dependency type
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

// Example function for prompting further dependency management
async function promptForDependencies(packageInfo) {
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

async function initializePackageInfo(projectFolder, checkDevDependencies) {
  const packageJsonPath = path.join(projectFolder, "package.json");
  const packageJsonData = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonData);

  const dependencies = checkDevDependencies
    ? packageJson.devDependencies
    : packageJson.dependencies;

  return Object.entries(dependencies || {}).map(([name, version]) => ({
    name,
    currentVersion: version.replace(/[^\d.]/g, ""),
    latestVersion: "",
    outdated: false,
    deprecation: "",
    vulnerability: "",
    usedInProject: false,
    nodeCompatibility: ""
  }));
}

async function fetchPackageInfo(packageName) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

function isNodeVersionSupported(engines, nodeVersion) {
  if (engines && engines.node) {
    if (engines.node === "*") {
      return "Supported (Wildcard)";
    }
    return semver.satisfies(nodeVersion, engines.node)
      ? "Supported"
      : "Not Supported";
  }
  return "No specific version required";
}

async function enrichAllPackageInfo(
  packageInfo,
  projectFolder,
  nodeVersionToCheck
) {
  return Promise.all(
    packageInfo.map(async (pkg) => {
      const npmInfo = await fetchPackageInfo(pkg.name);
      const latestVersion = npmInfo["dist-tags"].latest;
      const isOutdated = !semver.satisfies(
        pkg.currentVersion,
        `>=${latestVersion}`
      );
      const nodeCompatibility = isNodeVersionSupported(
        npmInfo.versions[latestVersion]?.engines,
        nodeVersionToCheck
      );
      const usedInProject = isDependencyUsed(projectFolder, pkg.name);
      const deprecation = npmInfo.versions[latestVersion]?.deprecated
        ? "Deprecated"
        : "No";
      const deprecationInfo = npmInfo.versions[latestVersion]?.deprecated;
      return {
        ...pkg,
        latestVersion,
        outdated: isOutdated,
        nodeCompatibility,
        usedInProject,
        deprecation,
        deprecationInfo
      };
    })
  );
}

function isDependencyUsed(projectFolder, dependencyName) {
  const filesAndDirsToIgnore = ["node_modules", ".git", "update_package.js"];
  let isUsed = false;

  const checkUsageInFile = (filePath, searchTerms) => {
    const content = fs.readFileSync(filePath, "utf8");
    return searchTerms.some((term) => content.includes(term));
  };

  const traverseDirectory = (dirPath) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (filesAndDirsToIgnore.includes(entry.name)) continue;
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        traverseDirectory(entryPath);
      } else if (
        entry.isFile() &&
        [".js", ".jsx", ".ts", ".tsx"].includes(path.extname(entry.name))
      ) {
        const searchTerms = [
          dependencyName,
          dependencyName.split("/").pop()
        ].filter(Boolean);
        if (checkUsageInFile(entryPath, searchTerms)) {
          isUsed = true;
          return;
        }
      }
    }
  };

  traverseDirectory(projectFolder);
  return isUsed;
}

function displayPackageInfo(packageInfo) {
  console.log("Package Information:");
  const tableData = packageInfo.reduce((acc, pkg, index) => {
    acc[`${index + 1}`] = {
      Package: pkg.name,
      "Current Version": pkg.currentVersion,
      "Latest Version": pkg.latestVersion,
      Outdated: pkg.outdated ? "Yes" : "No",
      [`Node ${nodeVersionToCheck}`]: pkg.nodeCompatibility,
      Vulnerability: pkg.vulnerability !== "No" ? "Yes" : "No",
      Deprecation: pkg.deprecation !== "No" ? "Deprecated " : "No",
      "Used in Code": pkg.usedInProject ? "Yes" : "No "
    };
    return acc;
  }, {});
  console.table(tableData);
}

async function runCustomCommand(projectFolder) {
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

const listVulnerabilities = () => {
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
};

async function handleUserActions(packageInfo, projectFolder) {
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
        listVulnerabilities();
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
          nodeVersionToCheck
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

async function listFiles(projectFolder, dependencyUsage, packageInfo) {
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
      `-----------------------------------------------------------------------------------------------------------------`
    );
    console.log(
      `|  Dependency analysis report has been saved to ${filePath}  |`
    );
    console.log(
      `-----------------------------------------------------------------------------------------------------------------`
    );
  } catch (error) {
    console.error("Failed to generate or save the dependency report:", error);
  }
}

async function analyzeProjectDependencies(projectFolder) {
  const packageJsonPath = path.join(projectFolder, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const dependencies = packageJson.dependencies || {};

  let dependencyUsage = new Map();

  for (const dependency of Object.keys(dependencies)) {
    dependencyUsage.set(dependency, {
      used: false,
      usedInFiles: [],
      usedFunctions: new Set()
    });
  }

  await traverseDirectory(projectFolder, dependencyUsage, dependencies);
  return dependencyUsage;
}

async function traverseDirectory(dir, dependencyUsage, dependencies) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && !filePath.includes("node_modules")) {
      await traverseDirectory(filePath, dependencyUsage, dependencies);
    } else if (stats.isFile() && file.endsWith(".js")) {
      await analyzeFileUsage(filePath, dependencyUsage, dependencies);
    }
  }
}

async function analyzeFileUsage(filePath, dependencyUsage, dependencies) {
  const fileContents = fs.readFileSync(filePath, "utf8");

  for (const [dependency, usageInfo] of dependencyUsage.entries()) {
    const importRegex = new RegExp(
      `(require\\(['"\`]${dependency}['"\`]\\))|(from ['"\`]${dependency}['"\`])`,
      "g"
    );
    const variableNameRegex = new RegExp(
      `const\\s+(\\w+)\\s*=\\s*require\\s*\\('${dependency}'\\)`,
      "g"
    );
    const destructureRegex = new RegExp(
      `{\\s*\\b(\\w+)\\b\\s*}\\s*=\\s*require\\s*\\('${dependency}'\\)`,
      "g"
    );
    const classObjectVariableRegex = new RegExp(
      `(?<=\\bconst\\s+|let\\s+|var\\s+)(\\w+)\\s*=\\s*new\\s+${dependency}\\s*\\(`,
      "ig"
    );
    const importObjectVariableRegex = new RegExp(
      `
    import\\s*\\{([^{}]+)\\}\\s*from\\s*'${dependency}';`,
      "g"
    );

    let match;
    let variableName = null;
    let classVariableName = null;
    let importVariableName = null;
    // console.log("----------------filename----------------",filePath);
    while ((match = classObjectVariableRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      classVariableName = match[1]; // Capture variable name
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
    }

    while ((match = importObjectVariableRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      importVariableName = match[1]; // Capture variable name
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
    }

    // Check if the dependency is imported and try to capture the variable name it's assigned to
    while ((match = variableNameRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      variableName = match[1]; // Capture variable name
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
    }

    // Check for destructured imports
    while ((match = destructureRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
      usageInfo.usedFunctions.add(match[1]); // Add the destructured variable name to the usedFunctions set
    }
    let globelPackage = containsObject(dependency, globalIntiatedPackages);
    if (globelPackage) {
      let globelRegex = `sails.config.globals.${globelPackage.renamed_npm_name}(`;
      // console.log("contains global package000000000000000000flaverr ",globelPackage)
      if (fileContents.includes(globelRegex)) {
        // console.log("contains global regex flaverr---------------  ")
        usageInfo.used = true;
        usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
        // usageInfo.usedFunctions.add(match[1]); // Add the destructured variable name to the usedFunctions set
      }
    }

    // If the variable name was found, look for its usage in the file
    if (variableName) {
      // This regex looks for method calls on the imported module's instance or directly on the imported object
      const methodCallRegex = new RegExp(
        `\\b${variableName}\\b\\.\\w+\\s*\\(`,
        "g"
      );

      while ((match = methodCallRegex.exec(fileContents)) !== null) {
        // Extract method name from the match
        const methodCall = match[0];
        const methodNameMatch = methodCall.match(/\.(\w+)\s*\(/);
        if (methodNameMatch && methodNameMatch[1]) {
          usageInfo.usedFunctions.add(methodNameMatch[1]);
        }
      }
    }

    if (classVariableName) {
      // This regex looks for method calls on the imported module's instance or directly on the imported object
      const methodCallRegex = new RegExp(
        `\\b${classVariableName}\\b\\.\\w+\\s*\\(`,
        "g"
      );
      // console.log("classVariableName-------------------",classVariableName)
      while ((match = methodCallRegex.exec(fileContents)) !== null) {
        // console.log("classVariableName match-------------------",classVariableName)
        // Extract method name from the match
        const methodCall = match[0];
        const methodNameMatch = methodCall.match(/\.(\w+)\s*\(/);
        if (methodNameMatch && methodNameMatch[1]) {
          usageInfo.usedFunctions.add(methodNameMatch[1]);
        }
      }
    }

    if (importVariableName) {
      // This regex looks for method calls on the imported module's instance or directly on the imported object
      const methodCallRegex = new RegExp(
        `\\b${importVariableName}\\b\\.\\w+\\s*\\(`,
        "g"
      );
      console.log("importVariableName-------------------", importVariableName);
      while ((match = methodCallRegex.exec(fileContents)) !== null) {
        console.log("importVariableNam matchj-------------------", match[0]);
        // Extract method name from the match
        const methodCall = match[0];
        const methodNameMatch = methodCall.match(/\.(\w+)\s*\(/);
        if (methodNameMatch && methodNameMatch[1]) {
          usageInfo.usedFunctions.add(methodNameMatch[1]);
        }
      }
    }

    // If no variable name was captured, or you want to catch all possible usages,
    // including dynamic imports or indirect usages, add additional checks here.
    // It might involve more complex patterns or even parsing the AST for complete accuracy.

    // Improved regex to match both require and import statements.
    if (fileContents.match(importRegex)) {
      usageInfo.used = true;
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));

      // This regex attempts to capture any use of methods or functions from the imported dependency.
      // It captures patterns like "const x = require('dependency').method()" or "import { method } from 'dependency'; method();"
      // Adjustments may be needed based on the actual usage patterns in your codebase.
      const functionUsageRegex = new RegExp(
        `(?:\\b${dependency}\\b\\.\\w+\\s*\\(|\\brequire\\(['"\`]${dependency}['"\`]\\)\\.\\w+\\s*\\(|\\b${dependency}\\b\\s*\\(\\s*\\))`,
        "g"
      );

      while ((match = functionUsageRegex.exec(fileContents)) !== null) {
        // Since this captures the call expression, you might want to process it further to extract just the method name.
        const functionCall = match[0];
        // Attempt to extract a more meaningful name or identifier for the function usage.
        const functionNameMatch = functionCall.match(/\.(\w+)\s*\(/);
        if (functionNameMatch && functionNameMatch[1]) {
          // Add just the function or method name to the set.
          usageInfo.usedFunctions.add(functionNameMatch[1]);
        } else {
          // If the function name couldn't be directly extracted, use the whole match.
          usageInfo.usedFunctions.add(functionCall);
        }
      }
    }

    // Check for async/await usage
    const asyncAwaitRegex = new RegExp(
      `await\\s+${dependency}\\.\\w+\\s*\\(`,
      "g"
    );
    while ((match = asyncAwaitRegex.exec(fileContents)) !== null) {
      const asyncAwaitCall = match[0];
      const methodNameMatch = asyncAwaitCall.match(/\.(\w+)\s*\(/);
      if (methodNameMatch && methodNameMatch[1]) {
        usageInfo.usedFunctions.add(methodNameMatch[1]);
      }
    }

    // Check for cases like "const { Parser } = require('saxen');"
    const destructuredImportRegex = new RegExp(
      `const\\s+{\\s*(\\w+)\\s*}\\s*=\\s*require\\('${dependency}'\\)`,
      "g"
    );
    while ((match = destructuredImportRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
      usageInfo.usedFunctions.add(match[1]); // Add the destructured variable name to the usedFunctions set
    }

    // Check for cases like "const Sparkpost = require('sparkpost'); const client = new Sparkpost();"
    const instanceCreationRegex = new RegExp(
      `const\\s+\\w+\\s*=\\s*new\\s+${dependency}\\s*\\(`,
      "g"
    );
    while ((match = instanceCreationRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
      usageInfo.usedFunctions.add("constructor"); // Add the constructor method to the usedFunctions set
    }
  }
}

async function updatePackageInteraction(packageInfo, projectFolder) {
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

  // Analyze package usage
  console.log(`Analyzing usage of package: ${pkg.name}`);
  findPackageUsageInProject(pkg.name, projectFolder);

  // Proceed with update confirmation
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

  // Perform package update
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
function findPackageUsageInProject(packageName, projectFolder) {
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

function checkPeerDependencies(packageName) {
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

function installPackageAndHandleFailure(
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

function showDeprecationDetails(packageInfo) {
  const deprecatedPackages = packageInfo.filter(
    (pkg) => pkg.deprecation === "Deprecated"
  );
  if (deprecatedPackages.length === 0) {
    console.log("No deprecated packages found.");
    return;
  }

  deprecatedPackages.forEach((pkg, index) => {
    console.log(
      `${index + 1}. ${pkg.name}: ${
        pkg.deprecationInfo || "No additional info"
      }`
    );
  });
}

const globalImports = async (path) => {
  const fileContents = fs.readFileSync(path + "\\config\\globals.js", "utf8");
  const regex =
    /^\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s*:\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)(?![^\/]*\*\/)/gm;
  let globalPackages = [];
  let match;
  while ((match = regex.exec(fileContents)) !== null) {
    globalPackages.push({
      registerd_npm_name: match[2],
      renamed_npm_name: match[1]
    });
  }
  return globalPackages;
};

function containsObject(obj, list) {
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i].registerd_npm_name === obj) {
      return list[i];
    }
  }

  return false;
}

main().catch(console.error);
