// What RequireAuth hands to the login page through router state
export interface LoginState {
  from: string;
  expired: boolean;
}

// Router state is untyped, so it is checked before use. Only same-site paths are accepted as the return
// target: "//host" would be read by the browser as another site (open redirect).
export function readLoginState(state: unknown): LoginState {
  const { from, expired } = (typeof state === "object" && state !== null ? state : {}) as Record<
    string,
    unknown
  >;
  const isInternalPath = typeof from === "string" && from.startsWith("/") && !from.startsWith("//");
  return {
    from: isInternalPath ? from : "/",
    expired: expired === true,
  };
}
