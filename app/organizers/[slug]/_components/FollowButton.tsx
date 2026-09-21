"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { isFollowingOrganizer, toggleFollowOrganizer } from "@/app/_lib/store";

export function FollowButton({ slug }: { slug: string }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    // One-time hydration of client-only localStorage state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFollowing(isFollowingOrganizer(slug));
  }, [slug]);

  return (
    <Button
      type="button"
      variant={following ? "primary" : "secondary"}
      onClick={() => setFollowing(toggleFollowOrganizer(slug))}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
