"use client";

import type { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import type React from "react";
import { createContext } from "react";

export type DrawerPosition = "right" | "left" | "top" | "bottom";

export const DrawerContext: React.Context<{ position: DrawerPosition }> = createContext<{
  position: DrawerPosition;
}>({
  position: "bottom",
});

export const drawerDirectionMap: Record<
  DrawerPosition,
  DrawerPrimitive.Root.Props["swipeDirection"]
> = {
  bottom: "down",
  left: "left",
  right: "right",
  top: "up",
};
