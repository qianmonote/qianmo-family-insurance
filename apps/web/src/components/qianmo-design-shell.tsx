import { Bell, CircleHelp, FileClock, Home, Plus, Search, Settings, ShieldCheck, Sparkles, UserCircle } from "lucide-react";
import Link from "next/link";
import type React from "react";

import { cn } from "@qianmo-family-insurance/ui/lib/utils";

import { QianmoLogoutButton } from "./qianmo-logout-button";

type NavKey = "home" | "summary" | "history";

const navItems = [
  { key: "home", label: "Home", href: "/dashboard", icon: Home },
  { key: "summary", label: "Summarize", href: "/summary", icon: Sparkles },
  { key: "history", label: "History", href: "/summary/records", icon: FileClock },
] as const;

export function QianmoTopNav({ active }: { active: NavKey }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#c3c5d9]/30 bg-[#f8f9ff]/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <Link href="/summary" className="text-xl font-bold text-[#003ec7]">
          阡陌家庭保
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "border-b-2 border-transparent pb-1 text-sm font-medium text-[#434656] transition-colors hover:text-[#003ec7]",
                active === item.key && "border-[#003ec7] font-bold text-[#003ec7]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-full p-2 text-[#434656] transition-colors hover:bg-[#e5eeff] hover:text-[#003ec7]" aria-label="通知">
            <Bell className="size-5" />
          </button>
          <button type="button" className="rounded-full p-2 text-[#434656] transition-colors hover:bg-[#e5eeff] hover:text-[#003ec7]" aria-label="账户">
            <UserCircle className="size-5" />
          </button>
          <QianmoLogoutButton />
        </div>
      </div>
    </header>
  );
}

export function QianmoSideNav({ active }: { active: NavKey }) {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-col border-r border-[#c3c5d9]/30 bg-[#eff4ff] p-6 shadow-sm lg:flex">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#003ec7]">Family Guardian</h1>
        <p className="mt-1 text-xs font-medium text-[#434656]/70">Premium Member</p>
      </div>
      <Link href="/summary" className="mb-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#003ec7] px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95">
        <Plus className="size-4" />
        New Entry
      </Link>
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.slice(1).map((item) => {
          const Icon = item.icon;
          const selected = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#434656] transition-all hover:bg-[#d3e4fe]/60",
                selected && "bg-[#25fea8] text-[#005232] shadow-sm",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#434656] transition-all hover:bg-[#d3e4fe]/60">
          <Settings className="size-5" />
          Settings
        </Link>
      </nav>
      <div className="border-t border-[#c3c5d9]/40 pt-4">
        <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#434656] transition-all hover:bg-[#d3e4fe]/60">
          <CircleHelp className="size-5" />
          Support
        </a>
        <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#434656] transition-all hover:bg-[#d3e4fe]/60">
          <UserCircle className="size-5" />
          Account
        </a>
      </div>
    </aside>
  );
}

export function QianmoAppShell({
  active,
  children,
  withSideNav = false,
}: {
  active: NavKey;
  children: React.ReactNode;
  withSideNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      {withSideNav && <QianmoSideNav active={active} />}
      <div className={cn(withSideNav && "lg:pl-64")}>
        <QianmoTopNav active={active} />
        {children}
        <QianmoFooter />
      </div>
    </div>
  );
}

export function QianmoFooter() {
  return (
    <footer className="border-t border-[#c3c5d9]/30 bg-[#d3e4fe]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-center md:flex-row md:px-8 md:text-left">
        <div>
          <div className="text-xl font-bold text-[#003ec7]">阡陌家庭保</div>
          <p className="mt-1 text-xs font-medium text-[#434656]/80">© 2024 Qianmo Family Protect. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-5 text-xs font-medium text-[#434656]">
          <a href="#" className="underline underline-offset-4 hover:text-[#003ec7]">Privacy Policy</a>
          <a href="#" className="underline underline-offset-4 hover:text-[#003ec7]">Terms of Service</a>
          <a href="#" className="underline underline-offset-4 hover:text-[#003ec7]">Legal Disclaimer</a>
          <a href="#" className="underline underline-offset-4 hover:text-[#003ec7]">Contact Us</a>
        </div>
      </div>
    </footer>
  );
}

export function SearchControl({ placeholder = "搜索标题或链接..." }: { placeholder?: string }) {
  return (
    <div className="relative min-w-0 flex-1 sm:min-w-72">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#737688]" />
      <input
        className="w-full rounded-xl border border-[#c3c5d9]/60 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-[#737688] focus:border-[#003ec7] focus:ring-2 focus:ring-[#003ec7]/20"
        placeholder={placeholder}
        type="search"
      />
    </div>
  );
}

export function TrustBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#25fea8]/25 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#006c44]">
      <ShieldCheck className="size-4" />
      Secure Access
    </div>
  );
}
