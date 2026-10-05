"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PrimaryButton, SuccessButton } from "./core/Button";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { label: "Markets", href: "/markets", section: "/markets" },
  { label: "Trade", href: "/trade/SOL_USDC", section: "/trade" },
];

export const Appbar = () => {
  const route = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fundingNotice, setFundingNotice] = useState(false);

  // Tapping a link in the sheet navigates, so the sheet closes with the route.
  useEffect(() => {
    setMenuOpen(false);
    setFundingNotice(false);
  }, [route]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setFundingNotice(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-6 lg:gap-8">
          <Link href="/markets" className="flex flex-none items-center gap-2">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              priority
              className="h-7 w-7"
            />
            <span
              className="text-base font-bold tracking-[-0.035em] sm:text-lg"
              translate="no"
            >
              OpenExchange
            </span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            {links.map(({ label, href, section }) => {
              const active = route.startsWith(section);
              return (
                /* The marker sits on the header's own bottom border, so
                               the active section reads at a glance without a pill. */
                <Link
                  key={label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-16 items-center text-xs transition-colors duration-200 ${active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-px bg-foreground" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-none items-center gap-2">
          <ThemeToggle />
          <span className="mx-2 hidden h-5 w-px bg-border sm:block" />
          <div className="hidden items-center gap-2 sm:flex">
            <PrimaryButton onClick={() => setFundingNotice((v) => !v)}>
              Withdraw
            </PrimaryButton>
            <SuccessButton onClick={() => setFundingNotice((v) => !v)}>
              Deposit
            </SuccessButton>
          </div>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground sm:hidden"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 top-16 bg-background/60 sm:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="animate-rise absolute inset-x-0 top-full flex flex-col gap-1 border-b border-border bg-elevated p-3 shadow-xl sm:hidden">
            <nav className="flex flex-col">
              {links.map(({ label, href, section }) => {
                const active = route.startsWith(section);
                return (
                  <Link
                    key={label}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-11 items-center rounded-lg px-3 text-left text-sm transition-colors duration-200 ${active ? "bg-foreground/5 font-medium text-foreground" : "text-muted-foreground"}`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <SuccessButton
                onClick={() => {
                  setMenuOpen(false);
                  setFundingNotice(true);
                }}
                className="h-11 w-full"
              >
                Deposit
              </SuccessButton>
              <PrimaryButton
                onClick={() => {
                  setMenuOpen(false);
                  setFundingNotice(true);
                }}
                className="h-11 w-full"
              >
                Withdraw
              </PrimaryButton>
            </div>
          </div>
        </>
      )}
      {fundingNotice && (
        <div
          role="status"
          className="absolute right-4 top-[calc(100%+8px)] flex w-[min(340px,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-border bg-elevated p-4 text-xs leading-relaxed sm:right-8"
        >
          <p className="flex-1 text-muted-foreground">
            <strong className="mb-1 block font-semibold text-foreground">
              Funding is unavailable in this demo.
            </strong>
            You can explore live markets and try the order ticket with a demo
            balance.
          </p>
          <button
            type="button"
            aria-label="Dismiss funding notice"
            onClick={() => setFundingNotice(false)}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md transition-colors hover:bg-muted"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
};
