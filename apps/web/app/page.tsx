import { Markets } from "./components/Markets";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tighter">Markets</h1>
        <p className="text-muted-foreground">Live prices for every listed market.</p>
      </div>
      <Markets />
    </main>
  );
}
