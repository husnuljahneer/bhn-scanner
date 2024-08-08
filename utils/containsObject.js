export function containsObject(obj, list) {
  let i;
  for (i = 0; i < list.length; i++) {
    if (list[i].registerd_npm_name === obj) {
      return list[i];
    }
  }

  return false;
}
