export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex flex-col gap-1 border-b border-border pb-4">
      <h1 className="text-[30px] font-extrabold leading-tight text-foreground">
        {title}
      </h1>
      {subtitle ? <p className="text-[13px] text-muted">{subtitle}</p> : null}
    </header>
  );
}
