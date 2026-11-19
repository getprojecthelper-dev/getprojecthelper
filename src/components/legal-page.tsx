import brandMark from "@/assets/mentor-mark.png";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";


export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="landing-editorial legal-page min-h-screen">
      <header className="landing-header border-b border-border/60">
        <div className="landing-header__inner mx-auto flex max-w-5xl items-center justify-between px-5 sm:px-6">
          <Link to="/" className="landing-header__brand flex items-center gap-2 font-display font-semibold">
            <img src={brandMark} alt="" width={512} height={512} className="h-6 w-6" />
            GetProjectHelper
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase text-primary">Legal</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{description}</p>
        <p className="mt-5 text-sm text-muted-foreground">Effective 20 September 2026</p>

        <article className="mt-10 space-y-9 text-[15px] leading-7 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:space-y-1">
          {children}
        </article>
      </main>

      <footer className="landing-footer border-t border-border">
        <nav className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-2 px-5 py-8 text-sm text-muted-foreground sm:px-6" aria-label="Legal">
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/refund-policy" className="hover:text-foreground">Refund policy</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy notice</Link>
          <span className="sm:ml-auto">© 2026 GetProjectHelper</span>
        </nav>
      </footer>
    </div>
  );
}
