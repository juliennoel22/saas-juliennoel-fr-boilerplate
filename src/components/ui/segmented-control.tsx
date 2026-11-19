"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import {
  SegmentedControlIndicator,
  segmentedControlIndicatorSurfaceClassName,
} from "@/components/ui/segmented-control-indicator";
import { cn } from "@/lib/utils";

export { segmentedControlIndicatorSurfaceClassName };
export type SegmentedControlSize = "default" | "lg" | "sm";

export const segmentedControlItemSizeClassNames: Record<SegmentedControlSize, string> = {
  default: "h-8.5 px-[calc(--spacing(2.5)-1px)] sm:h-7.5",
  lg: "h-9.5 px-[calc(--spacing(3)-1px)] sm:h-8.5",
  sm: "h-7.5 px-[calc(--spacing(2)-1px)] sm:h-6.5",
};

export const segmentedControlItemLayoutClassName =
  "gap-1.5 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0";

const SegmentedControlContext: React.Context<SegmentedControlSize> =
  React.createContext<SegmentedControlSize>("default");

export function SegmentedControl({
  className,
  children,
  render,
  size = "default",
  ...props
}: useRender.ComponentProps<"div"> & {
  size?: SegmentedControlSize;
}): React.ReactElement {
  const defaultProps = {
    children: (
      <>
        {children}
        <SegmentedControlIndicator />
      </>
    ),
    className: cn(
      "relative z-0 flex w-fit items-center justify-center gap-0.5 rounded-lg bg-muted p-0.5",
      className,
    ),
    "data-size": size,
    "data-slot": "segmented-control",
  };

  const element = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });

  return (
    <SegmentedControlContext.Provider value={size}>
      {element}
    </SegmentedControlContext.Provider>
  );
}

export function SegmentedControlItem({
  className,
  render,
  size,
  ...props
}: useRender.ComponentProps<"button"> & {
  size?: SegmentedControlSize;
}): React.ReactElement {
  const contextSize = React.useContext(SegmentedControlContext);
  const resolvedSize = size ?? contextSize;

  const defaultProps = {
    className: cn(
      "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-md border border-transparent font-medium text-base text-muted-foreground/72 outline-2 outline-transparent transition-[color,outline-color] hover:bg-transparent hover:text-muted-foreground focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-64 data-disabled:pointer-events-none data-disabled:opacity-64 sm:text-sm",
      "data-checked:bg-background data-checked:text-foreground data-checked:shadow-sm/5 dark:data-checked:bg-input",
      "aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm/5 dark:aria-[current=page]:bg-input",
      "data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm/5 dark:data-pressed:bg-input",
      "[:has(>[data-slot=segmented-control-indicator]:not([hidden]))>&]:bg-transparent! [:has(>[data-slot=segmented-control-indicator]:not([hidden]))>&]:shadow-none!",
      segmentedControlItemLayoutClassName,
      segmentedControlItemSizeClassNames[resolvedSize],
      className,
    ),
    "data-size": resolvedSize,
    "data-slot": "segmented-control-item",
    ...(render ? {} : { type: "button" as const }),
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}
