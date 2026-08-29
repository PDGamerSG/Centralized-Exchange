import { redirect } from "next/navigation";

// Markets is the front door; the root path just forwards to it so there is
// only one copy of the list to maintain.
export default function Home() {
  redirect("/markets");
}
