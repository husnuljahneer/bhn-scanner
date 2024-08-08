<img src="https://i.imgur.com/HHrXUBf.png" width="250" height="250" />

# Pepper-Scanner

Pepper Scanner is an innovative CLI tool designed to enhance project security and maintenance for Node.js developers. By scanning your Node.js project, Pepper Scanner provides comprehensive insights into package dependencies, including version discrepancies, deprecations, vulnerabilities, and Node.js compatibility checks. It streamlines the update process by offering options to update packages, audit for vulnerabilities, and much more, all from the comfort of your terminal.

<code><img width="30" src="https://user-images.githubusercontent.com/25181517/121401671-49102800-c959-11eb-9f6f-74d49a5e1774.png" alt="npm" title="npm"/> &nbsp;<a href='https://www.npmjs.com/package/pepper-scanner'>Link to the NPM Package</a></code>

## Features

- **Dependency Analysis**: Quickly identify outdated, deprecated, or vulnerable packages.
- **Node.js Compatibility**: Checks if your packages are compatible with your Node.js version.
- **Interactive Updates**: Update packages individually or in bulk with interactive prompts.
- **Vulnerability Audit**: Leverage npm audit seamlessly within the tool to identify security issues.
- **Custom Commands**: Execute custom npm commands directly through the tool for added flexibility.
- **Peer Dependencies Check**: Automatically checks and informs about missing peer dependencies.
- **Project Dependency Analyzer**: Analyze and manage dependencies during Node.js version migrations.

## Installation

Pepper Scanner is available as an npm package. You can install it globally using npm or yarn:

```bash
npm install -g pepper-scanner
```

Or using yarn:

```
yarn global add pepper-scanner
```

## Usage

Once installed, you can run Pepper Scanner within your Node.js project directory using the following command:

```bash
pepper-scanner
```

The tool will then guide you through various options and actions you can perform on your project.

## Commands

- Update a Package: Selectively update packages to their latest versions.
- List Vulnerabilities: Run an npm audit to check for known vulnerabilities.
- Show Deprecated Packages: List all dependencies that are marked as deprecated.
- Review Package Information: Display a comprehensive table with details on each package.
- Execute Custom NPM Command: Run any npm command directly from Pepper Scanner.
- Clear Console: Clears the terminal screen for a cleaner workspace.
- Exit: Quit the Pepper Scanner application.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

### Fork the Project

```bash
git checkout -b feature/AmazingFeature
git commit -m 'Add some AmazingFeature'
git push origin feature/AmazingFeature
```

> [!IMPORTANT] > _Open a Pull Request_

## Functional Descriptions

### Main Functions

- main(): Orchestrates the script's flow, handles user input, and directs the sequence of actions based on user choices.
- initializePackageInfo(): Extracts package information from package.json, checking each package's current version against its latest version and compatibility with the desired Node.js version.
- enrichAllPackageInfo(): Enhances package data with additional details from the npm registry, such as the latest version, deprecation status, and usage within the project.
- listFiles(): Generates and writes a report detailing dependency usage within the project.
  Helper Functions
- fetchPackageInfo(packageName): Fetches metadata from the npm registry for a given package.
- isDependencyUsed(projectFolder, dependencyName): Scans the project directory to determine if a dependency is used in the project files.
- traverseDirectory(dir, dependencyUsage, dependencies): Recursively traverses the project directory to analyze files for dependencies.
- analyzeFileUsage(filePath, dependencyUsage, dependencies): Analyzes a file to check for import statements and usage of dependencies.

## Flowchart

Refer to the attached flowchart in this repository for a visual representation of the script's operational flow.

> [!NOTE] > <code><img width="400" src="https://i.imgur.com/2ZyJhHJ.png" alt="npm" title="npm"/></code>

## License

Distributed under the MIT License.
