export function currentRoute() {
  return decodeURIComponent(location.hash.slice(1) || "/");
}

