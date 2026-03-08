"use client";

import * as React from "react";

function ScrollArea({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`relative overflow-auto ${className ?? ""}`}
      style={{ scrollbarWidth: "none" }}
      {...props}
    >
      {children}
    </div>
  );
}

function ScrollBar(_props: { orientation?: "horizontal" | "vertical" }) {
  return null;
}

export { ScrollArea, ScrollBar };
