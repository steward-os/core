import PocketBase from "pocketbase";

const params = new URLSearchParams(window.location.search);
const pocketbaseUrlParam = params.get("pocketbase_url");
const tenant = params.get("tenant");

// defininig the url from tenants only works for the onzemuziek.nl domain
const resolvedFromParams = pocketbaseUrlParam ?? (tenant ? `https://app.onzemuziek.nl/pb/${tenant}` : null);

if (resolvedFromParams) {
  localStorage.setItem("pocketbase_url", resolvedFromParams);
}

const url =
  resolvedFromParams ??
  localStorage.getItem("pocketbase_url") ??
  import.meta.env.VITE_POCKETBASE_URL ??
  `http://${window.location.hostname}:8090`;

console.log("Using PocketBase URL:", url);
const pb = new PocketBase(url);

export default pb;
