
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  textSize?: string;
  iconSize?: string;
  href?: string;
}

export function Logo({
  className,
  textSize = "text-xl",
  iconSize = "w-6 h-6",
  href = "/"
}: LogoProps) {
  const content = (
    <span className={cn("font-bold tracking-tight", textSize)}>
      <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">V</span>
      <span className="bg-gradient-to-r from-sky-500 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">Base</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={cn("inline-flex items-center gap-2 hover:opacity-90 transition-opacity", className)}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {content}
    </div>
  );
}

