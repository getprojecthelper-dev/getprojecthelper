import { HomepageRoadmap } from "@/components/homepage-roadmap";
import { HomepagePaths } from "@/components/homepage-paths";
import brandMark from "@/assets/mentor-mark.png";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Check,
  Files,
  Folder,
  Home,
  LayoutGrid,
  ListTodo,
  Menu,
  Plus,
  Share2,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PREMADE_PROJECTS } from "@/lib/premade-projects";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GetProjectHelper | Custom projects and ready-made products" },
      {
        name: "description",
        content: "Request a guided custom project or explore ready-made digital project products.",
      },
      {
        property: "og:title",
        content: "GetProjectHelper | Custom projects and ready-made products",
      },
      {
        property: "og:description",
        content: "Choose a custom project or explore a ready-made digital product.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://getprojecthelper.com/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://getprojecthelper.com/" }],
  }),
  component: Landing,
});

const catalogPreview = PREMADE_PROJECTS.slice(0, 3);

function Landing() {
  const { session } = useAuth();
  const getStarted = session ? "/welcome" : "/auth";
  const signup = session ? {} : { mode: "signup" as const };
  const products = session ? "/premade" : "/auth";
  const productSearch = session ? {} : { mode: "signup" as const };

  return (
    <div className="landing-editorial min-h-screen bg-white text-[#111111] selection:bg-[#d4f5df] selection:text-[#111111]">
      <Header
        getStarted={getStarted}
        signup={signup}
        products={products}
        productSearch={productSearch}
        signedIn={Boolean(session)}
      />
      <main>
        <section className="landing-hero overflow-hidden px-5 pb-0 pt-14 sm:px-8 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-[90rem] text-center">
            <h1 className="mx-auto max-w-6xl font-display text-[clamp(3.25rem,8.3vw,7.7rem)] font-semibold leading-[.98] tracking-[-.075em]">
              From idea to
              <br className="hidden sm:block" />
              <span className="landing-finished-pill mx-2 inline-flex translate-y-[-.025em] items-center gap-3 rounded-full px-5 py-1 sm:mx-4 sm:gap-5 sm:px-9">
                <span
                  className="size-3.5 shrink-0 rounded-full bg-[#18aa4a] sm:size-5"
                  aria-hidden="true"
                />
                <span>finished</span>
              </span>{" "}
              project.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[#3f3f46] sm:text-xl sm:leading-8">
              <span className="block">
                Share your idea, ask AI for suggestions, or paste a job description to generate a project idea.
              </span>
              <span className="mt-1 block">Or choose a product that’s ready to use.</span>
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-[#0866e8] px-6 text-base font-semibold text-white shadow-none hover:bg-[#0757c7]"
              >
                <Link to={getStarted} search={signup}>
                  Start a custom project <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-[#e8f2ff] px-6 text-base font-semibold text-[#0757ad] shadow-none hover:bg-[#d9eaff]"
              >
                <Link to={products} search={productSearch}>
                  Browse products <ArrowDownRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div
              className="landing-preview mx-auto mt-16 max-w-6xl overflow-hidden rounded-t-2xl border border-[#e4e4e7] bg-white text-left shadow-[0_24px_80px_-36px_rgba(15,23,42,.28)] sm:mt-20"
              aria-label="Preview of a project workspace"
            >
              <div className="flex h-11 items-center gap-2 border-b border-[#e4e4e7] bg-[#fafafa] px-4">
                <span className="size-2.5 rounded-full bg-[#ff6058]" />
                <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
                <div className="ml-3 flex h-8 min-w-44 items-center gap-2 rounded-t-lg border border-b-0 border-[#e4e4e7] bg-white px-3 text-xs font-medium text-[#27272a]">
                  <span className="grid size-4 place-items-center rounded bg-[#0866e8] text-[9px] font-bold text-white">
                    G
                  </span>{" "}
                  GetProjectHelper
                </div>
                <span className="ml-auto hidden text-xs text-[#71717a] sm:block">
                  Workspace preview
                </span>
              </div>
              <div className="grid min-h-[300px] grid-cols-[150px_1fr] sm:grid-cols-[190px_1fr]">
                <aside className="border-r border-[#e4e4e7] bg-[#fbfbfa] p-3 sm:p-4">
                  <div className="grid gap-1.5 text-xs font-medium text-[#52525b]">
                    <span className="flex items-center gap-2 rounded-md px-2 py-2">
                      <Home className="size-3.5" /> My projects
                    </span>
                    <span className="flex items-center gap-2 rounded-md px-2 py-2">
                      <LayoutGrid className="size-3.5" /> Templates
                    </span>
                    <span className="flex items-center gap-2 rounded-md px-2 py-2">
                      <BookOpen className="size-3.5" /> Products
                    </span>
                  </div>
                  <div className="my-3 border-t border-[#e4e4e7]" />
                  <span className="flex items-center gap-2 rounded-md bg-[#e8f2ff] px-2 py-2 text-xs font-semibold text-[#0757ad]">
                    <Folder className="size-3.5" /> Website redesign
                  </span>
                  <span className="mt-2 flex items-center gap-2 px-2 py-1.5 text-xs text-[#52525b]">
                    <ListTodo className="size-3.5" /> Roadmap
                  </span>
                  <span className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#52525b]">
                    <Files className="size-3.5" /> Project files
                  </span>
                </aside>
                <div className="min-w-0 p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e4e7] pb-4">
                    <div className="flex items-center gap-2">
                      <Folder className="size-5 text-[#52525b]" />
                      <h2 className="font-display text-lg font-semibold tracking-tight sm:text-2xl">
                        Website redesign
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#e4e4e7] px-3 text-xs font-medium text-[#3f3f46]"
                    >
                      <Share2 className="size-3.5" /> Share
                    </button>
                  </div>
                  <div className="flex gap-5 border-b border-[#e4e4e7] text-xs font-medium text-[#52525b]">
                    <span className="border-b-2 border-[#0866e8] py-3 text-[#0757ad]">Roadmap</span>
                    <span className="py-3">Tasks</span>
                    <span className="py-3">Notes</span>
                    <span className="py-3">Files</span>
                  </div>
                  <div className="grid gap-4 pt-4 lg:grid-cols-[1.3fr_.9fr]">
                    <div className="rounded-xl border border-[#e4e4e7] p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Project roadmap</h3>
                        <span className="text-[10px] text-[#71717a]">NEXT 4 WEEKS</span>
                      </div>
                      <div className="mt-4 grid grid-cols-[82px_repeat(4,minmax(0,1fr))] items-center gap-y-3 text-[10px] text-[#71717a] sm:grid-cols-[100px_repeat(4,minmax(0,1fr))]">
                        <span />
                        {["Week 1", "Week 2", "Week 3", "Week 4"].map((week) => (
                          <span key={week}>{week}</span>
                        ))}
                        <span className="text-[#3f3f46]">Plan & scope</span>
                        <span className="col-span-1 h-2.5 rounded-full bg-[#b8edc8]" />
                        <span />
                        <span />
                        <span />
                        <span className="text-[#3f3f46]">Design</span>
                        <span />
                        <span className="col-span-1 h-2.5 rounded-full bg-[#bad7ff]" />
                        <span />
                        <span />
                        <span className="text-[#3f3f46]">Build</span>
                        <span />
                        <span />
                        <span className="col-span-1 h-2.5 rounded-full bg-[#d9c7ff]" />
                        <span />
                        <span className="text-[#3f3f46]">Test & launch</span>
                        <span />
                        <span />
                        <span />
                        <span className="h-2.5 rounded-full bg-[#ffe29a]" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e4e4e7] p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Next tasks</h3>
                        <span className="flex items-center gap-1 text-[10px] text-[#52525b]">
                          <Plus className="size-3" /> New
                        </span>
                      </div>
                      <ul className="mt-3 divide-y divide-[#f0f0f1] text-xs">
                        {[
                          [true, "Define project goals"],
                          [true, "Complete design mockups"],
                          [false, "Build core pages"],
                          [false, "Run final review"],
                        ].map(([done, label]) => (
                          <li key={String(label)} className="flex items-center gap-2.5 py-2">
                            <span
                              className={`grid size-4 place-items-center rounded border ${done ? "border-[#18aa4a] bg-[#18aa4a] text-white" : "border-[#a1a1aa]"}`}
                            >
                              {done && <Check className="size-3" />}
                            </span>
                            <span
                              className={done ? "text-[#71717a] line-through" : "text-[#27272a]"}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <HomepageRoadmap />
        <HomepagePaths />

        <section
          id="products"
          className="border-y border-[#14120f] bg-[#e6e2d8] px-5 py-20 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-[90rem]">
            <div className="flex flex-col gap-6 border-b border-[#14120f] pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[.17em] text-[#376d5c]">
                  02 / Ready-made products
                </p>
                <h2 className="mt-4 max-w-2xl font-display text-5xl font-semibold leading-[.92] tracking-[-.075em] sm:text-6xl">
                  A practical place to start.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#514c45]">
                  Explore project briefs already in the catalog. Review the scope and tools before
                  checkout.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="h-11 w-fit rounded-none border-[#14120f] bg-transparent text-[#14120f] shadow-none hover:bg-[#d9e4da] hover:text-[#14120f]"
              >
                <Link to={products} search={productSearch}>
                  View all products <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {catalogPreview.map((product, index) => (
                <article
                  key={product.id}
                  className="flex flex-col border border-[#14120f] bg-[#fdfbf6] transition-transform duration-200 hover:-translate-y-1"
                >
                  <div
                    className={`flex min-h-36 items-end justify-between border-b border-[#14120f] p-5 ${index === 0 ? "bg-[#dce9df]" : index === 1 ? "bg-[#e0e4ef]" : "bg-[#f0ddcb]"}`}
                  >
                    <span className="max-w-[15rem] font-display text-3xl font-semibold leading-[.95] tracking-[-.055em]">
                      {product.title}
                    </span>
                    <span className="font-mono text-xs font-bold">0{index + 1}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm leading-6 text-[#514c45]">{product.summary}</p>
                    <div className="mt-5 flex flex-wrap gap-2 text-xs">
                      <span className="border border-[#d4cec2] px-2 py-1">{product.level}</span>
                      <span className="border border-[#d4cec2] px-2 py-1">{product.stack}</span>
                    </div>
                    <p className="mt-5 text-xs text-[#746d63]">
                      Localized price shown in catalog / checkout
                    </p>
                    <Link
                      to={products}
                      search={productSearch}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#376d5c] hover:text-[#14120f]"
                    >
                      Review product details <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="why"
          className="border-y border-[#14120f] bg-[#14120f] px-5 py-16 text-[#f5f2eb] sm:px-8 sm:py-20"
        >
          <div className="mx-auto grid max-w-[90rem] gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[.17em] text-[#ff9b83]">
                Why GetProjectHelper
              </p>
              <h2 className="mt-5 max-w-lg font-display text-4xl font-semibold leading-[.95] tracking-[-.065em] sm:text-5xl">
                A clear starting point for the work ahead.
              </h2>
            </div>
            <ul className="divide-y divide-white/20 border-y border-white/20">
              {[
                "Choose between guided custom project setup and ready-made products.",
                "See each product's brief, level and tools before deciding.",
                "Keep planning, building and project guidance in one workspace.",
              ].map((item) => (
                <li key={item} className="flex gap-4 py-5 text-base leading-7 text-[#ddd7cc]">
                  <Check className="mt-1 size-4 shrink-0 text-[#ff9b83]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto flex max-w-[90rem] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[.17em] text-[#a94229]">
                Choose your next step
              </p>
              <h2 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[.9] tracking-[-.075em] sm:text-7xl">
                What do you need for your next project?
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#514c45]">
                Request a guided project or find a ready-made product.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-none bg-[#a94229] px-6 text-base text-white shadow-none hover:bg-[#14120f]"
              >
                <Link to={getStarted} search={signup}>
                  Get a Project <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-none border-[#14120f] bg-transparent px-6 text-base text-[#14120f] shadow-none hover:bg-[#dce9df] hover:text-[#14120f]"
              >
                <Link to={products} search={productSearch}>
                  Browse Products <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer
        getStarted={getStarted}
        signup={signup}
        products={products}
        productSearch={productSearch}
      />
    </div>
  );
}

function Header({
  getStarted,
  signup,
  products,
  productSearch,
  signedIn,
}: {
  getStarted: "/welcome" | "/auth";
  signup: Record<string, string>;
  products: "/premade" | "/auth";
  productSearch: Record<string, string>;
  signedIn: boolean;
}) {
  return (
    <header className="border-b border-[#f0f0f0] bg-white px-5 py-4 sm:px-8">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-5">
        <Link
          to="/"
          className="flex items-center gap-3 font-display text-lg font-semibold tracking-[-.04em]"
        >
          <img src={brandMark} alt="" className="size-8 rounded-xl object-cover" />
          <span>GetProjectHelper</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          <a href="#services" className="hover:text-[#0866e8]">
            Product
          </a>
          <a href="#how-it-works" className="hover:text-[#0866e8]">
            Resources
          </a>
          <Link to="/pricing" className="hover:text-[#0866e8]">
            Pricing
          </Link>
        </nav>
        <div className="hidden items-center gap-5 sm:flex">
          {!signedIn && (
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="text-sm font-semibold hover:text-[#0866e8]"
            >
              Sign in
            </Link>
          )}
          <Link
            to={getStarted}
            search={signup}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0866e8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0757c7]"
          >
            Get started
          </Link>
        </div>
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg text-[#14120f] hover:bg-[#f4f4f5] hover:text-[#14120f]"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l-[#e4e4e7] bg-white text-[#14120f]">
              <SheetTitle className="font-display text-lg">GetProjectHelper</SheetTitle>
              <nav className="mt-9 grid border-t border-[#e4e4e7]">
                <SheetClose asChild>
                  <a
                    href="#get-project"
                    className="border-b border-[#e4e4e7] py-4 text-sm font-semibold"
                  >
                    Get a Project
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to={products}
                    search={productSearch}
                    className="border-b border-[#e4e4e7] py-4 text-sm font-semibold"
                  >
                    Products
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <a
                    href="#services"
                    className="border-b border-[#e4e4e7] py-4 text-sm font-semibold"
                  >
                    Product
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/pricing"
                    className="border-b border-[#e4e4e7] py-4 text-sm font-semibold"
                  >
                    Pricing
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to={getStarted}
                    search={signup}
                    className="mt-6 rounded-xl bg-[#0866e8] px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Get started
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Footer({
  getStarted,
  signup,
  products,
  productSearch,
}: {
  getStarted: "/welcome" | "/auth";
  signup: Record<string, string>;
  products: "/premade" | "/auth";
  productSearch: Record<string, string>;
}) {
  return (
    <footer className="border-t border-[#14120f] bg-[#ded8cb] px-5 py-8 sm:px-8">
      <div className="mx-auto grid max-w-[90rem] gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold">GetProjectHelper</p>
          <p className="mt-2 text-sm text-[#514c45]">
            Custom projects and ready-made digital products.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[.14em]">Services</p>
          <div className="mt-3 grid gap-2 text-sm text-[#514c45]">
            <Link to={getStarted} search={signup} className="hover:text-[#14120f]">
              Get a Project
            </Link>
            <Link to={products} search={productSearch} className="hover:text-[#14120f]">
              Products
            </Link>
          </div>
        </div>
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[.14em]">Company</p>
          <div className="mt-3 grid gap-2 text-sm text-[#514c45]">
            <a href="#services" className="hover:text-[#14120f]">
              About GetProjectHelper
            </a>
            <a href="mailto:support@getprojecthelper.com" className="hover:text-[#14120f]">
              Contact support
            </a>
          </div>
        </div>
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[.14em]">Legal</p>
          <div className="mt-3 grid gap-2 text-sm text-[#514c45]">
            <Link to="/terms" className="hover:text-[#14120f]">
              Terms and Conditions
            </Link>
            <Link to="/privacy" className="hover:text-[#14120f]">
              Privacy Policy
            </Link>
            <Link to="/refund-policy" className="hover:text-[#14120f]">
              Refund Policy
            </Link>
          </div>
        </div>
        <div className="text-sm text-[#514c45] sm:col-span-2 lg:col-span-4">
          © 2026 Sizcon Studios
        </div>
      </div>
    </footer>
  );
}
