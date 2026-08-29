import { Markets } from "../components/Markets";

export const metadata = {
  title: "Markets · OpenExchange",
  description: "Live prices, 24h change and volume for every listed market.",
};

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tighter sm:text-4xl">Markets</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Live prices for every listed market.</p>
      </div>
      <Markets />
    </main>
  );
}
