"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TimelinePhase {
  id: string;
  name: string;
  duration_weeks: number;
  tasks: string[];
  dependencies: string[];
}

interface TimelineData {
  phases: TimelinePhase[];
  total_weeks: number;
  total_hours: number;
  total_cost: number;
  assumptions: string[];
  risks: string[];
}

interface TimelineViewProps {
  timeline: TimelineData;
}

const PHASE_COLORS = [
  "bg-blue-500 dark:bg-blue-600",
  "bg-purple-500 dark:bg-purple-600",
  "bg-green-500 dark:bg-green-600",
  "bg-orange-500 dark:bg-orange-600",
  "bg-pink-500 dark:bg-pink-600",
  "bg-cyan-500 dark:bg-cyan-600",
  "bg-yellow-500 dark:bg-yellow-600",
  "bg-red-500 dark:bg-red-600",
];

export function TimelineView({ timeline }: TimelineViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const totalWeeks = Math.ceil(timeline.total_weeks);
  const weekMarkers = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  let currentWeek = 0;
  const phasePositions = timeline.phases.map((phase, index) => {
    const startWeek = currentWeek;
    const widthPercentage = (phase.duration_weeks / timeline.total_weeks) * 100;
    const leftPercentage = (currentWeek / timeline.total_weeks) * 100;
    const phaseBudget = (phase.duration_weeks / timeline.total_weeks) * timeline.total_cost;
    currentWeek += phase.duration_weeks;

    return {
      phase,
      startWeek,
      endWeek: currentWeek,
      widthPercentage,
      leftPercentage,
      phaseBudget,
      color: PHASE_COLORS[index % PHASE_COLORS.length],
    };
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (weeks: number) => {
    const wholeWeeks = Math.floor(weeks);
    const remainingDays = Math.round((weeks - wholeWeeks) * 5);
    
    if (remainingDays === 0) {
      return `${wholeWeeks} week${wholeWeeks !== 1 ? 's' : ''}`;
    }
    return `${wholeWeeks}w ${remainingDays}d`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative pb-32">
          <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
            {weekMarkers.map(week => (
              <div
                key={week}
                className="flex-1 text-center"
                style={{ maxWidth: `${100 / totalWeeks}%` }}
              >
                W{week}
              </div>
            ))}
          </div>

          <div className="relative h-12 bg-muted/30 rounded-md overflow-visible">
            {phasePositions.map(({ phase, widthPercentage, leftPercentage, phaseBudget, color }) => (
              <div
                key={phase.id}
                className={`absolute h-full ${color} hover-elevate cursor-pointer transition-all duration-200`}
                style={{
                  left: `${leftPercentage}%`,
                  width: `${widthPercentage}%`,
                }}
                onMouseEnter={() => setHoveredPhase(phase.id)}
                onMouseLeave={() => setHoveredPhase(null)}
                onClick={() => togglePhase(phase.id)}
                data-testid={`timeline-bar-${phase.id}`}
              >
                {hoveredPhase === phase.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10 bg-popover text-popover-foreground rounded-lg shadow-xl border-2 overflow-hidden min-w-64">
                    <div className={`${color} px-4 py-2`}>
                      <div className="font-semibold text-white text-sm">{phase.name}</div>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Duration</span>
                        <span className="text-sm font-medium">{formatDuration(phase.duration_weeks)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Budget</span>
                        <span className="text-sm font-medium">{formatCurrency(phaseBudget)}</span>
                      </div>
                      <div className="pt-1 border-t">
                        <div className="text-xs text-muted-foreground text-center">
                          {phase.tasks.length} task{phase.tasks.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {phasePositions.map(({ phase, startWeek, endWeek, color }, index) => (
            <Card key={phase.id} className="overflow-hidden" data-testid={`phase-card-${phase.id}`}>
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full p-4 text-left hover-elevate active-elevate-2 flex items-center justify-between gap-3"
                data-testid={`button-toggle-phase-${phase.id}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-4 h-4 rounded ${color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{phase.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Week {Math.ceil(startWeek + 1)} - {Math.ceil(endWeek)} • {phase.duration_weeks} week{phase.duration_weeks !== 1 ? 's' : ''} • {phase.tasks.length} task{phase.tasks.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                {expandedPhases.has(phase.id) ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {expandedPhases.has(phase.id) && (
                <div className="px-4 pb-4 pt-0 space-y-2 border-t">
                  <div className="pt-3">
                    <div className="text-sm font-medium mb-2">Tasks:</div>
                    <ul className="space-y-1">
                      {phase.tasks.map((task, taskIndex) => (
                        <li
                          key={taskIndex}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                          data-testid={`task-${phase.id}-${taskIndex}`}
                        >
                          <span className="text-muted-foreground/50">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {phase.dependencies.length > 0 && (
                    <div className="pt-2">
                      <div className="text-sm font-medium mb-1">Dependencies:</div>
                      <div className="text-sm text-muted-foreground">
                        {phase.dependencies.join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
