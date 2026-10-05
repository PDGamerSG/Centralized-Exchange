import Link from "next/link";
import { Markets } from "../components/Markets";
import { ArrowUpRight } from "../components/core/Icons";

export const metadata = {
  title: "Markets · OpenExchange",
  description: "Live prices, 24h change and volume for every listed market.",
};

export default function Page() {
  return (
    <main
      id="main-content"
      className="market-page mx-auto w-full max-w-[1440px] px-4 pb-8 pt-8 sm:px-8 sm:pt-12 lg:px-12"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Markets
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            A clear view of crypto. Every market, in one place.
          </p>
        </div>
        <Link
          href="/trade/SOL_USDC"
          className="inline-flex h-11 items-center gap-3 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Open trading terminal <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <Markets />
      <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
        <span>
          OpenExchange <span className="mx-2 text-foreground/25">/</span> A
          little clarity in a moving market.
        </span>
        <span>Market data refreshes every 10 seconds.</span>
      </footer>
    </main>
  );
}
