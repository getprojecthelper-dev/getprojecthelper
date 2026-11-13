import { HomepageRoadmap } from "@/components/homepage-roadmap";
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
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listHomepageListings } from "@/lib/premade-listings.functions";
import { getPaddleEnvironment } from "@/lib/paddle";

const techStackColors: Record<string, string> = {
  react: "bg-[#d9f3ff] text-[#075985]",
  typescript: "bg-[#dbeafe] text-[#1d4ed8]",
  supabase: "bg-[#dcfce7] text-[#166534]",
  recharts: "bg-[#f3e8ff] text-[#7e22ce]",
  python: "bg-[#fef3c7] text-[#92400e]",
  fastapi: "bg-[#cffafe] text-[#155e75]",
  "node.js": "bg-[#e4f4dc] text-[#3f6212]",
  postgresql: "bg-[#e0eafe] text-[#1e40af]",
};

function getTechStackColor(technology: string) {
  return techStackColors[technology.trim().toLowerCase()] ?? "bg-[#eee9ff] text-[#5b3da8]";
}

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

function Landing() {
  const environment = getPaddleEnvironment();
  const fetchListings = useServerFn(listHomepageListings);
  const { data: listings = [] } = useQuery({
    queryKey: ["homepage-listings", environment],
    queryFn: () => fetchListings({ data: { environment } }),
  });
  const demoProjects = [
    {
      id: "demo-campus-companion",
      title: "Campus Companion",
      description:
        "Plan classes, track assignments, and keep campus events in one simple student dashboard.",
      techStack: "React · TypeScript · Supabase",
      imageUrl: "/student-project-workspace.png",
      badge: "POPULAR PICK",
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
    {
      id: "demo-analytics-dashboard",
      title: "Analytics Dashboard",
      description: "Explore clear charts and useful metrics in a responsive analytics workspace.",
      techStack: "React · TypeScript · Recharts",
      imageUrl: "/analytics-dashboard-project.png",
      badge: "TRENDING",
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
    {
      id: "demo-project-collaboration",
      title: "Project Collaboration",
      description: "Organize tasks, share updates, and keep a small team moving together.",
      techStack: "React · Node.js · PostgreSQL",
      imageUrl: "/project-collaboration.png",
      badge: "NEW TECH",
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
    {
      id: "demo-research-paper-workspace",
      title: "Research Paper Workspace",
      description:
        "Collect sources, organize literature notes, and shape your findings into a clear report.",
      techStack: "Python · FastAPI · PostgreSQL",
      imageUrl: "/research-paper-workspace.svg",
      badge: "NEW",
      priceMinor: 0,
      isAvailable: false,
      demo: true,
    },
  ];
  const catalogPreview =
    listings.length > 0
      ? listings.slice(0, 3).map((listing) => ({ ...listing, demo: false }))
      : demoProjects;
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
        <section
          id="get-project"
          className="landing-hero scroll-mt-8 overflow-hidden px-5 pb-0 pt-14 sm:px-8 sm:pt-20 lg:pt-24"
        >
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
                Share your idea, ask AI for suggestions, or paste a job description to generate a
                project idea.
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
        <section
          id="services"
          className="scroll-mt-8 border-y border-[#e4e4e7] bg-white px-5 py-16 text-[#111111] sm:px-8 sm:py-20"
        >
          <div className="mx-auto max-w-[90rem]">
            <div className="flex flex-col gap-6 border-b border-[#e4e4e7] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="products"
                  className="max-w-4xl font-display text-5xl font-semibold leading-[.94] tracking-[-.075em] sm:text-6xl"
                >
                  Explore ready-made projects
                </h2>
                <p className="mt-3 max-w-xl text-lg leading-7 text-[#62666e]">
                  Find your starting point. Make it yours.
                </p>
              </div>
              <Button
                asChild
                className="h-11 w-fit rounded-xl bg-[#e8f2ff] px-5 text-sm font-semibold text-[#0757ad] shadow-none hover:bg-[#d9eaff]"
              >
                <Link to={products} search={productSearch}>
                  Browse all projects <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            {catalogPreview.length > 0 && (
              <div className="mx-auto mt-7 grid max-w-5xl items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalogPreview.map((product) => (
                  <article
                    key={product.id}
                    className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-[0_5px_24px_rgba(17,17,17,.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(17,17,17,.09)]"
                  >
                    {product.imageUrl ? (
                      <div className="relative">
                        <img
                          src={product.imageUrl}
                          alt={`Preview image for ${product.title}`}
                          loading="lazy"
                          className="aspect-[16/10] w-full border-b border-[#e4e4e7] object-cover"
                        />
                        {product.demo && (
                          <span
                            aria-label={`Demo tag: ${product.badge}`}
                            className={`absolute right-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#111111] shadow-sm ${
                              product.badge === "TRENDING"
                                ? "bg-[#f5e642]"
                                : product.badge === "NEW TECH"
                                  ? "bg-[#d4f5df]"
                                  : "bg-[#dceaff]"
                            }`}
                          >
                            {product.badge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        role="img"
                        aria-label={`Image preview unavailable for ${product.title}`}
                        className="flex aspect-[16/10] items-end justify-between border-b border-[#e4e4e7] bg-[#f5f8fc] p-5"
                      >
                        <span className="max-w-[18rem] font-display text-3xl font-semibold leading-[.95] tracking-[-.055em]">
                          {product.title}
                        </span>
                        <span className="font-mono text-xs font-bold uppercase text-[#0757ad]">
                          Project
                        </span>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col bg-[#f1f1f1] p-3 sm:p-4">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-semibold leading-tight tracking-[-.04em] sm:text-2xl">
                          {product.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#62666e]">
                            Tech stack
                          </span>
                          <div className="flex min-w-0 flex-wrap gap-1">
                            {product.techStack.split(/[·,]/).map((technology) => {
                              const label = technology.trim();
                              return (
                                <span
                                  key={label}
                                  className={`rounded-full px-2 py-1 text-[10px] font-semibold leading-none ${getTechStackColor(label)}`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        {product.demo && (
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <span className="mr-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#62666e]">
                              Includes
                            </span>
                            {["Dataset", "Documentation", "Report", "Research paper"].map(
                              (item) => (
                                <span
                                  key={item}
                                  className="whitespace-nowrap rounded-full border border-[#d4d4d8] bg-white/75 px-1.5 py-1 text-[9px] font-medium leading-none text-[#3f3f46]"
                                >
                                  {item}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm leading-5 text-[#525866]">
                        {product.description}
                      </p>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                        <div>
                          <p className="text-xs text-[#62666e]">
                            {product.isAvailable ? "One-time purchase" : "Currently unavailable"}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-[#111111] sm:text-xl">
                            ₹{(product.priceMinor / 100).toLocaleString("en-IN")}
                          </p>
                        </div>
                        {product.demo ? (
                          <span className="inline-flex min-h-11 items-center rounded-lg border border-[#d4d4d8] px-3 py-2 text-sm font-semibold text-[#62666e]">
                            Demo project
                          </span>
                        ) : !product.isAvailable ? (
                          <span className="inline-flex min-h-11 items-center rounded-lg border border-[#d4d4d8] px-3 py-2 text-sm font-semibold text-[#62666e]">
                            Not available
                          </span>
                        ) : session ? (
                          <Link
                            to="/premade/$projectId"
                            params={{ projectId: product.id }}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0866e8] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0757c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0866e8]"
                          >
                            Explore project <ArrowRight className="size-4" />
                          </Link>
                        ) : (
                          <Link
                            to="/auth"
                            search={{ mode: "signup" }}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0866e8] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0757c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0866e8]"
                          >
                            Explore project <ArrowRight className="size-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
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
