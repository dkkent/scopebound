"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Layers, AlertTriangle, Info } from "lucide-react";

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

interface TimelineStatsProps {
  timeline: TimelineData;
}

export function TimelineStats({ timeline }: TimelineStatsProps) {
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
    return `${wholeWeeks} week${wholeWeeks !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="stat-duration">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-weeks">
              {formatDuration(timeline.total_weeks)}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeline.total_hours.toFixed(0)} hours
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-cost">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-cost">
              {formatCurrency(timeline.total_cost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated investment
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-phases">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phases</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-phases-count">
              {timeline.phases.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeline.phases.reduce((sum, p) => sum + p.tasks.length, 0)} total tasks
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-risks">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identified Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-risks-count">
              {timeline.risks.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Proactively managed
            </p>
          </CardContent>
        </Card>
      </div>

      {timeline.assumptions.length > 0 && (
        <Card data-testid="card-assumptions">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Key Assumptions
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {timeline.risks.length > 0 && (
        <Card data-testid="card-risks">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Important Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
