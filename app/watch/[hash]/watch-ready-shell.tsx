"use client";

import { WatchPageShell as InnerWatchPageShell } from "@/components/player/watch-page-shell";

type WatchReadyShellProps = React.ComponentProps<typeof InnerWatchPageShell> & {
  requiresStreamPreparation?: boolean;
};

export function WatchReadyShell(props: WatchReadyShellProps) {
  void props.requiresStreamPreparation;
  return <InnerWatchPageShell {...props} />;
}
