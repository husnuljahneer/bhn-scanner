export function displayPackageInfo(packageInfo) {
  console.log("Package Information:");
  const tableData = packageInfo.reduce((acc, pkg, index) => {
    acc[`${index + 1}`] = {
      Package: pkg.name,
      "Current Version": pkg.currentVersion,
      "Latest Version": pkg.latestVersion,
      Outdated: pkg.outdated ? "Yes" : "No",
      [`Node ${process.version}`]: pkg.nodeCompatibility,
      Deprecated: pkg.deprecation !== "No" ? "Deprecated " : "No",
      "Used in Code": pkg.usedInProject ? "Yes" : "No "
    };
    return acc;
  }, {});
  console.table(tableData);
}
