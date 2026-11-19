import type { Toast } from "@base-ui/react/toast";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type React from "react";

export const TOAST_ICONS = {
  error: CircleAlertIcon,
  info: InfoIcon,
  loading: LoaderCircleIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
} as const;

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type SwipeDirection = "up" | "down" | "left" | "right";

export type ToastData = {
  rootProps?: Omit<
    React.ComponentProps<typeof Toast.Root>,
    "children" | "className" | "swipeDirection" | "toast"
  >;
  tooltipStyle?: boolean;
};

export function getSwipeDirection(position: ToastPosition): SwipeDirection[] {
  const verticalDirection: SwipeDirection = position.startsWith("top") ? "up" : "down";
  if (position.includes("center")) return [verticalDirection];
  if (position.includes("left")) return ["left", verticalDirection];
  return ["right", verticalDirection];
}

export function upsertReplayClassName(toast: {
  type?: string;
  updateKey?: number;
}): string | undefined {
  const k = toast.updateKey ?? 0;
  if (k <= 0) return undefined;
  const isEven = k % 2 === 0;
  if (toast.type === "error") {
    return isEven
      ? "animate-toast-error-even motion-reduce:animate-none"
      : "animate-toast-error-odd motion-reduce:animate-none";
  }
  return isEven
    ? "animate-toast-success-even motion-reduce:animate-none"
    : "animate-toast-success-odd motion-reduce:animate-none";
}
