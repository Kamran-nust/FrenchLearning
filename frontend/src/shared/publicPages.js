// Pages anyone can open without signing in, by address (the app itself is behind sign-in).
export const DELETE_ACCOUNT_PATH = "/delete-account";
export const PRIVACY_PATH = "/privacy";

function normalize(pathname) {
  return (pathname || "").replace(/\/+$/, "").toLowerCase();
}

export function isDeleteAccountInfoPath(pathname) {
  return normalize(pathname) === DELETE_ACCOUNT_PATH;
}

export function isPrivacyPath(pathname) {
  return normalize(pathname) === PRIVACY_PATH;
}
