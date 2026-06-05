const { supabase } = require("../lib/supabase");
const { createOAuth2Client, SCOPES } = require("../lib/google");
const googleTokenService = require("./googleToken.service");
const { createError, fromSupabaseError } = require("../utils/errors");

function getAuthUrl(tenantId) {
  if (!tenantId) {
    throw createError("tenant_id is required", 400);
  }

  const oauth2Client = createOAuth2Client();
  const state = Buffer.from(JSON.stringify({ tenantId })).toString("base64url");

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

function parseState(state) {
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    if (!parsed.tenantId) throw new Error("missing tenantId");
    return parsed;
  } catch {
    throw createError("Invalid OAuth state", 400);
  }
}

async function handleCallback({ code, state }) {
  if (!code) {
    throw createError("Authorization code missing", 400);
  }

  console.log("STEP 1 - CALLBACK START");

const { tenantId } = parseState(state);
console.log("STEP 2 - TENANT:", tenantId);

const oauth2Client = createOAuth2Client();

const { tokens } = await oauth2Client.getToken(code);
console.log("STEP 3 - TOKEN RECEIVED");

oauth2Client.setCredentials(tokens);

await googleTokenService.saveTokens(tenantId, tokens);
console.log("STEP 4 - TOKENS SAVED");

const { accountId, locationId } =
  await discoverDefaultLocation(oauth2Client);

console.log(
  "STEP 5 - LOCATION FOUND",
  accountId,
  locationId
);

  const { error } = await supabase()
    .from("tenants")
    .update({
      google_account_id: accountId,
      google_location_id: locationId,
    })
    .eq("id", tenantId);

  if (error) throw fromSupabaseError(error);

  return { tenantId, accountId, locationId, connected: true };
}

async function discoverDefaultLocation(auth) {
  console.log("GBP 1 - ENTER DISCOVER");

  const { google } = require("googleapis");

  const accountMgmt = google.mybusinessaccountmanagement({
    version: "v1",
    auth,
  });

  let accountsRes;

try {
  accountsRes = await accountMgmt.accounts.list();
} catch (err) {
  console.error(
    "GBP ACCOUNTS ERROR:",
    JSON.stringify(err.response?.data || err.message, null, 2)
  );
  throw err;
}

  console.log(
    "GBP 2 - ACCOUNTS",
    JSON.stringify(accountsRes.data, null, 2)
  );

  const account = accountsRes.data.accounts?.[0];

  if (!account?.name) {
    throw createError(
      "No Google Business accounts found for this user",
      404
    );
  }

  const accountId = account.name.replace("accounts/", "");

  const businessInfo = google.mybusinessbusinessinformation({
    version: "v1",
    auth,
  });

  const locationsRes = await businessInfo.accounts.locations.list({
    parent: account.name,
    readMask: "name,title",
    pageSize: 1,
  });

  console.log(
    "GBP 3 - LOCATIONS",
    JSON.stringify(locationsRes.data, null, 2)
  );

  const location = locationsRes.data.locations?.[0];

  if (!location?.name) {
    throw createError(
      "No business locations found for this account",
      404
    );
  }

  const locationId = location.name.split("/").pop();

  console.log(
    "GBP 4 - FOUND",
    accountId,
    locationId
  );

  return { accountId, locationId };
}

module.exports = { getAuthUrl, handleCallback, parseState };
