import { useCallback } from "react";
import { useBeforeUnload, useBlocker, type BlockerFunction } from "react-router";

// useBlocker covers in-app navigation (menu, links, back button); useBeforeUnload covers reload and closing
// the tab, which useBlocker does not see. The login redirect is never blocked: with an expired session
// there is no way to save anyway.
export function useUnsavedChangesGuard(isDirty: boolean) {
  // useCallback keeps the same function between renders, so the blocker is only rebuilt when isDirty changes
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      nextLocation.pathname !== "/login" &&
      nextLocation.pathname !== currentLocation.pathname,
    [isDirty],
  );
  const blocker = useBlocker(shouldBlock);

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (isDirty) {
          event.preventDefault();
        }
      },
      [isDirty],
    ),
  );

  return blocker;
}
