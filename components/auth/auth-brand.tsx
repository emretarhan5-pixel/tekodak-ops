export function AuthBrand({
  title = "TEKODAK OPS",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 text-center">
      <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
        TEKODAK
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
