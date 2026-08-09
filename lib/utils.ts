import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind en évitant les conflits (ex. deux
 * classes "px-*" contradictoires). Utilisé par tous les composants UI.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
