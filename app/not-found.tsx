import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return <main className="route-error"><span className="route-code">404</span><h1>Page not found</h1><p>The link may be incorrect, or the invitation address may have changed.</p><Link href="/"><Home aria-hidden="true" /> Back to Wisal</Link></main>;
}
