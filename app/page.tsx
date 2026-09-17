import { redirect } from "next/navigation";

/** The default persona (Brand Owner) lands on Overview (Section 3 login flow). */
export default function Home() {
  redirect("/overview");
}
