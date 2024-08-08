import semver from "semver";

export function isNodeVersionSupported(engines, nodeVersion) {
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
