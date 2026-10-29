import { useContext } from "react";
import { AnnouncerContext } from "./AnnouncerContext";

export function useAnnounce() {
  const announce = useContext(AnnouncerContext);
  if (!announce) {
    throw new Error("useAnnounce must be used inside AnnouncerProvider");
  }
  return announce;
}
