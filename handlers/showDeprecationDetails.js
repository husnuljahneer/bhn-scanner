export function showDeprecationDetails(packageInfo) {
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
