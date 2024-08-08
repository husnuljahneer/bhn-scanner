import fetch from "node-fetch";

export async function fetchPackageInfo(packageName) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}
