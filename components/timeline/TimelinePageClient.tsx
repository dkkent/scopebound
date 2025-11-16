"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { TimelineView } from "./TimelineView";
import { TimelineStats } from "./TimelineStats";

interface TimelineData {
  phases: Array<{
    id: string;
    name: string;
    duration_weeks: number;
    tasks: string[];
    dependencies: string[];
  }>;
  total_weeks: number;
  total_hours: number;
  total_cost: number;
  assumptions: string[];
  risks: string[];
}

interface TimelinePageClientProps {
  timeline: TimelineData;
  project: {
    name: string;
    clientName: string;
    projectType: string;
    projectBrief: string;
  };
}

export function TimelinePageClient({ timeline, project }: TimelinePageClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>

      <header className="border-b no-print">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-project-name">
                {project.name}
              </h1>
              <p className="text-muted-foreground">
                Project Timeline for {project.clientName}
              </p>
            </div>
            <Button variant="outline" className="no-print" data-testid="button-questions">
              <MessageCircle className="w-4 h-4 mr-2" />
              Questions?
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="print-break-inside-avoid">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Project Overview</h2>
            <p className="text-muted-foreground">{project.projectBrief}</p>
          </div>
        </section>

        <section className="print-break-inside-avoid" data-testid="section-stats">
          <h2 className="text-xl font-semibold mb-4">Timeline Summary</h2>
          <TimelineStats timeline={timeline} />
        </section>

        <section className="print-break-inside-avoid" data-testid="section-timeline">
          <h2 className="text-xl font-semibold mb-4">Project Phases</h2>
          <TimelineView timeline={timeline} />
        </section>

        {timeline.assumptions.length > 0 && (
          <section className="print-break-inside-avoid" data-testid="section-assumptions">
            <h2 className="text-xl font-semibold mb-4">Key Assumptions</h2>
            <div className="bg-muted/30 rounded-lg p-6">
              <ul className="space-y-2">
                {timeline.assumptions.map((assumption, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                    data-testid={`assumption-${index}`}
                  >
                    <span className="text-muted-foreground/50 mt-0.5">•</span>
                    <span>{assumption}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {timeline.risks.length > 0 && (
          <section className="print-break-inside-avoid" data-testid="section-risks">
            <h2 className="text-xl font-semibold mb-4">Important Risks</h2>
            <div className="bg-muted/30 rounded-lg p-6">
              <ul className="space-y-2">
                {timeline.risks.map((risk, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                    data-testid={`risk-${index}`}
                  >
                    <span className="text-muted-foreground/50 mt-0.5">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <footer className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground no-print">
          <p>
            This timeline is subject to change based on project requirements and client feedback.
          </p>
          <p className="mt-2">
            Have questions? Contact us to discuss this timeline in detail.
          </p>
        </footer>
      </main>
    </div>
  );
}
