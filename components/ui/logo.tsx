import { Sparkles } from 'lucide-react';

export function Logo({ className = "w-6 h-6", isDark = false }: { className?: string; isDark?: boolean }) {
  return (
    <Sparkles className={`${className} ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
  );
}
