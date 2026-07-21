import { cn } from '@/lib/utils';

export type LanguageDotProps = {
  language: string;
  /** Language swatch color, e.g. "#3178c6" — data, not a theme token. */
  color: string;
  className?: string;
};

export function LanguageDot({ language, color, className }: LanguageDotProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] font-mono text-xs text-muted-foreground tabular-nums',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-[9px] flex-none rounded-full"
        style={{ backgroundColor: color }}
      />
      {language}
    </span>
  );
}
