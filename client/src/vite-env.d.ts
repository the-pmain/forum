/// <reference types="vite/client" />
import type { Workspace } from "@shared/types.ts";

declare global {
  interface Window {
    __NAVIGATOR__?: Workspace;
  }
}

export {};
