'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, MessageCircle, BarChart3, Trophy, Share2, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/impact', icon: BarChart3, label: 'Impact' },
  { href: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { href: '/observability', icon: Activity, label: 'AI Stats' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pointer-events-none" />

      <div className="relative glass border-t border-slate-700/50 px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-emerald-500/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
