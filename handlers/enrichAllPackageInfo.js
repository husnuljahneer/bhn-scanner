import semver from "semver";
import { fetchPackageInfo } from "./fetchPackageInfo.js";
import { isNodeVersionSupported } from "../helpers/isNodeVersionSupported.js";
import { isDependencyUsed } from "../utils/isDependencyUsed.js";

export async function enrichAllPackageInfo(
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
