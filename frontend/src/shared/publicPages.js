// Pages anyone can open without signing in, by address (the app itself is behind sign-in).
export const DELETE_ACCOUNT_PATH = "/delete-account";

export function isDeleteAccountInfoPath(pathname) {
  return (pathname || "").replace(/\/+$/, "").toLowerCase() === DELETE_ACCOUNT_PATH;
}
