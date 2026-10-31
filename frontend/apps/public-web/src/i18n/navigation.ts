import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Next's Link, redirect and hooks, aware of the language prefix
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
