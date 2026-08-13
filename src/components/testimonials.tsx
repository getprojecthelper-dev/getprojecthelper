import { Quote, Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Rohan Patel",
    role: "Computer Science student",
    body: "Project Helper got my final-year project done weeks early. The step-by-step implementation is the part that actually saved me.",
  },
  {
    name: "Sneha Iyer",
    role: "Data Science enthusiast",
    body: "The dataset guidance and structured roadmap saved me weeks of hunting through random tutorials.",
  },
  {
    name: "Arjun Mehta",
    role: "Full-stack developer",
    body: "From idea to submission everything stayed in one place — and the generated code was readable, not magic.",
  },
];

/** Social proof row for the landing page. */
export function Testimonials() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {REVIEWS.map((review) => (
        <figure key={review.name} className="panel flex flex-col p-6">
          <Quote className="h-5 w-5 text-primary/70" />
          <blockquote className="mt-3 flex-1 text-sm text-muted-foreground">
            “{review.body}”
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {review.name.charAt(0)}
            </span>
            <span>
              <span className="block text-sm font-semibold">{review.name}</span>
              <span className="block text-xs text-muted-foreground">{review.role}</span>
            </span>
          </figcaption>
          <div className="mt-3 flex gap-0.5 text-primary">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
        </figure>
      ))}
    </div>
  );
}
