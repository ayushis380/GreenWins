'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Leaf, Home, MessageCircle, BarChart3, Trophy, Share2 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/impact', icon: BarChart3, label: 'Impact' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/share', icon: Share2, label: 'Share' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
              >
                <Leaf className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-white">
                Green<span className="text-gradient">Wins</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative px-4 py-2 rounded-lg transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="header-indicator"
                        className="absolute inset-0 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span
                      className={`relative flex items-center gap-2 text-sm font-medium transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
