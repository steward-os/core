import PocketBase from "pocketbase";

// Every tenant has its own (sub)domain, so a production build talks to the domain it is served from
// (nginx passes /api to the tenant) and one build serves every tenant. The dev server runs apart
// from PocketBase.
const fallbackUrl = import.meta.env.DEV ? `http://${window.location.hostname}:8090` : window.location.origin;
const url = import.meta.env.VITE_POCKETBASE_URL || fallbackUrl;

// Left behind by the old ?tenant= / ?pocketbase_url= links; it would otherwise keep pointing elsewhere.
try {
  localStorage.removeItem("pocketbase_url");
} catch {
  // Storage can be unavailable (private mode); nothing to clean up then.
}

console.log("Using PocketBase URL:", url);
const pb = new PocketBase(url);

export default pb;
