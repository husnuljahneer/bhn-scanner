import fs from "fs";
import path from "path";
import { globalImports } from "../utils/globalImports.js";
import { containsObject } from "../utils/containsObject.js";

export async function analyzeFileUsage(
  filePath,
  dependencyUsage,
  dependencies
) {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const projectFolder = path.dirname(path.dirname(filePath));
  const globalIntiatedPackages = await globalImports(projectFolder);
  if (!globalIntiatedPackages) {
    console.log("No global modules");
  }
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
      `import\\s*\\{([^{}]+)\\}\\s*from\\s*'${dependency}';`,
      "g"
    );

    let match;
    let variableName = null;
    let classVariableName = null;
    let importVariableName = null;

    while ((match = classObjectVariableRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      classVariableName = match[1];
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
    }

    while ((match = importObjectVariableRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      importVariableName = match[1];
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
    }

    while ((match = variableNameRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      variableName = match[1];
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
    }

    while ((match = destructureRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
      usageInfo.usedFunctions.add(match[1]);
    }

    const globelPackage = containsObject(dependency, globalIntiatedPackages);
    if (globelPackage) {
      const globelRegex = `sails.config.globals.${globelPackage.renamed_npm_name}(`;
      if (fileContents.includes(globelRegex)) {
        usageInfo.used = true;
        usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
      }
    }

    if (variableName) {
      const methodCallRegex = new RegExp(
        `\\b${variableName}\\b\\.\\w+\\s*\\(`,
        "g"
      );

      while ((match = methodCallRegex.exec(fileContents)) !== null) {
        const methodCall = match[0];
        const methodNameMatch = methodCall.match(/\.(\w+)\s*\(/);
        if (methodNameMatch && methodNameMatch[1]) {
          usageInfo.usedFunctions.add(methodNameMatch[1]);
        }
      }
    }

    if (classVariableName) {
      const methodCallRegex = new RegExp(
        `\\b${classVariableName}\\b\\.\\w+\\s*\\(`,
        "g"
      );

      while ((match = methodCallRegex.exec(fileContents)) !== null) {
        const methodCall = match[0];
        const methodNameMatch = methodCall.match(/\.(\w+)\s*\(/);
        if (methodNameMatch && methodNameMatch[1]) {
          usageInfo.usedFunctions.add(methodNameMatch[1]);
        }
      }
    }

    if (importVariableName) {
      const methodCallRegex = new RegExp(
        `\\b${importVariableName}\\b\\.\\w+\\s*\\(`,
        "g"
      );
      console.log("importVariableName-------------------", importVariableName);
      while ((match = methodCallRegex.exec(fileContents)) !== null) {
        console.log("importVariableNam matchj-------------------", match[0]);
        const methodCall = match[0];
        const methodNameMatch = methodCall.match(/\.(\w+)\s*\(/);
        if (methodNameMatch && methodNameMatch[1]) {
          usageInfo.usedFunctions.add(methodNameMatch[1]);
        }
      }
    }

    if (fileContents.match(importRegex)) {
      usageInfo.used = true;
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));

      const functionUsageRegex = new RegExp(
        `(?:\\b${dependency}\\b\\.\\w+\\s*\\(|\\brequire\\(['"\`]${dependency}['"\`]\\)\\.\\w+\\s*\\(|\\b${dependency}\\b\\s*\\(\\s*\\))`,
        "g"
      );

      while ((match = functionUsageRegex.exec(fileContents)) !== null) {
        const functionCall = match[0];
        const functionNameMatch = functionCall.match(/\.(\w+)\s*\(/);
        if (functionNameMatch && functionNameMatch[1]) {
          usageInfo.usedFunctions.add(functionNameMatch[1]);
        } else {
          usageInfo.usedFunctions.add(functionCall);
        }
      }
    }

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

    const destructuredImportRegex = new RegExp(
      `const\\s+{\\s*(\\w+)\\s*}\\s*=\\s*require\\('${dependency}'\\)`,
      "g"
    );
    while ((match = destructuredImportRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
      usageInfo.usedFunctions.add(match[1]);
    }

    const instanceCreationRegex = new RegExp(
      `const\\s+\\w+\\s*=\\s*new\\s+${dependency}\\s*\\(`,
      "g"
    );
    while ((match = instanceCreationRegex.exec(fileContents)) !== null) {
      usageInfo.used = true;
      usageInfo.usedInFiles.push(path.relative(projectFolder, filePath));
      usageInfo.usedFunctions.add("constructor");
    }
  }
}
