// app/loading.tsx — shown while a top-level screen's server read is in flight (Home, Organizers,
// My WatNu, Search, Profile): the screen's shape, so the tab feels answered at once.
import { SkeletonScreen } from "./_components/Skeleton";

export default function Loading() {
  return <SkeletonScreen />;
}
