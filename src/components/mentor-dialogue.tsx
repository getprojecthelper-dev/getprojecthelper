import { RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useInView, usePrefersReducedMotion } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const EXCHANGES = [
  {
    student: "“My model has 96% accuracy so it is excellent.”",
    mentor:
      "“Accuracy alone does not establish that. Check class balance, precision, recall, F1-score and the confusion matrix before concluding that the model performs well.”",
  },
  {
    student: "“The report is basically done, I just need to write the results.”",
    mentor:
      "“Results are the section your examiner reads first. Nothing here is recorded yet — log the runs you actually did, then we can write about them.”",
  },
  {
    student: "“I'll add the tests at the end if there's time.”",
    mentor:
      "“Three of your requirements have no verification. Write one test case per requirement now, so the viva question ‘how do you know it works?’ has an answer.”",
  },
];

export function MentorDialogue() {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setRevealed(2);
      return;
    }
    setRevealed(0);
    const t1 = window.setTimeout(() => setRevealed(1), 250);
    const t2 = window.setTimeout(() => setRevealed(2), 1100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [inView, index, reduced]);

  const current = EXCHANGES[index]!;

  const line = (shown: boolean) =>
    cn(
      "transition-all duration-500 ease-out",
      shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-2 lg:items-center">
      <div>
        <ShieldCheck className="h-6 w-6 text-accent" />
        <h2 className="mt-3 font-display text-2xl font-semibold">
          An AI that won't just agree with you
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The mentor reads your recorded project state and refuses to invent results, metrics or
          citations. If a number isn't recorded, it says so.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={() => setIndex((i) => (i + 1) % EXCHANGES.length)}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Next example
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          {index + 1} of {EXCHANGES.length}
        </p>
      </div>

      <div ref={ref} className="panel min-h-[220px] space-y-4 p-6">
        <div className={line(revealed >= 1)}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Student
          </p>
          <p className="mt-1 text-sm">{current.student}</p>
        </div>
        <div className={cn("border-t border-border pt-4", line(revealed >= 2))}>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">AI Mentor</p>
          <p className="mt-1 text-sm">
            {revealed >= 2 ? (
              current.mentor
            ) : (
              <span className="inline-flex gap-1 align-middle">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
