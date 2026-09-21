import type { Category } from "./EventCard";
import { Card } from "./Card";
import { OrgLogo, type OrganizerType } from "./OrgLogo";
import { Button } from "./Button";
import { Icon, cx } from "./Icon";

export interface OrganizerCardProps {
  name: string;
  type: OrganizerType;
  category: Category;
  /** two letters for the monogram tile; derived from the name when omitted */
  initials?: string;
  /** logo image url; the monogram shows without it */
  logo?: string;
  following?: boolean;
  /** follow toggle; pass null to show a chevron instead (a plain directory row) */
  onFollow?: ((following: boolean) => void) | null;
  /** opens the organizer profile */
  onClick?: () => void;
  className?: string;
}

const TYPE_LABEL: Record<OrganizerType, string> = {
  association: "Student association",
  cafe: "Café",
  club: "Club",
  venue: "Venue",
};

/** A directory row: the logo tile, name, "type · category", and a small Follow button. */
export function OrganizerCard({ name, type, category, initials, logo, following, onFollow, onClick, className }: OrganizerCardProps) {
  const showChevron = onFollow === null;

  return (
    <Card as={onClick ? "button" : "div"} tight onClick={onClick} className={cx("flex! items-center gap-3", className)}>
      <OrgLogo name={name} initials={initials} type={type} src={logo} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="truncate text-[15px] font-semibold leading-5 text-ink">{name}</div>
        <div className="truncate text-[13px] font-medium leading-[18px] text-ink-muted">
          {TYPE_LABEL[type]} · {category}
        </div>
      </div>
      {showChevron ? (
        <Icon name="chevron-right" className="flex-none text-ink-muted" />
      ) : (
        <Button
          size="sm"
          variant={following ? "secondary" : "primary"}
          icon={following ? "check" : undefined}
          aria-pressed={following ? "true" : "false"}
          onClick={(e) => {
            e.stopPropagation();
            onFollow?.(!following);
          }}
          className="flex-none"
        >
          {following ? "Following" : "Follow"}
        </Button>
      )}
    </Card>
  );
}
