import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Send, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface TimelineEditorProps {
  timeline: TimelineData;
  projectId: string;
  hourlyRate: string;
  onSave?: () => void;
}

export function TimelineEditor({ timeline: initialTimeline, projectId, hourlyRate, onSave }: TimelineEditorProps) {
  const [timeline, setTimeline] = useState<TimelineData>(initialTimeline);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();

  const updatePhase = (phaseId: string, updates: Partial<TimelinePhase>) => {
    setTimeline(prev => ({
      ...prev,
      phases: prev.phases.map(p => 
        p.id === phaseId ? { ...p, ...updates } : p
      )
    }));
    recalculateTotals();
  };

  const addPhase = () => {
    const newPhase: TimelinePhase = {
      id: `phase-${timeline.phases.length + 1}`,
      name: "New Phase",
      duration_weeks: 1,
      tasks: ["New task"],
      dependencies: [],
    };
    setTimeline(prev => ({
      ...prev,
      phases: [...prev.phases, newPhase]
    }));
    recalculateTotals();
  };

  const removePhase = (phaseId: string) => {
    setTimeline(prev => ({
      ...prev,
      phases: prev.phases.filter(p => p.id !== phaseId)
    }));
    recalculateTotals();
  };

  const addTask = (phaseId: string) => {
    setTimeline(prev => ({
      ...prev,
      phases: prev.phases.map(p => 
        p.id === phaseId 
          ? { ...p, tasks: [...p.tasks, "New task"] }
          : p
      )
    }));
  };

  const updateTask = (phaseId: string, taskIndex: number, value: string) => {
    setTimeline(prev => ({
      ...prev,
      phases: prev.phases.map(p => 
        p.id === phaseId 
          ? { 
              ...p, 
              tasks: p.tasks.map((t, i) => i === taskIndex ? value : t)
            }
          : p
      )
    }));
  };

  const removeTask = (phaseId: string, taskIndex: number) => {
    setTimeline(prev => ({
      ...prev,
      phases: prev.phases.map(p => 
        p.id === phaseId 
          ? { ...p, tasks: p.tasks.filter((_, i) => i !== taskIndex) }
          : p
      )
    }));
  };

  const recalculateTotals = () => {
    setTimeline(prev => {
      const totalWeeks = prev.phases.reduce((sum, p) => sum + p.duration_weeks, 0);
      const hoursPerWeek = 40;
      const totalHours = totalWeeks * hoursPerWeek;
      const totalCost = totalHours * parseFloat(hourlyRate);

      return {
        ...prev,
        total_weeks: Number(totalWeeks.toFixed(1)),
        total_hours: Number(totalHours.toFixed(1)),
        total_cost: Number(totalCost.toFixed(2)),
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/update-timeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timelineData: timeline }),
      });

      if (!response.ok) {
        throw new Error("Failed to save timeline");
      }

      toast({
        title: "Timeline Saved",
        description: "Your changes have been saved successfully.",
      });

      onSave?.();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save timeline changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await handleSave();

      const response = await fetch(`/api/projects/${projectId}/approve-timeline`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to approve timeline");
      }

      toast({
        title: "Timeline Approved",
        description: "Timeline has been approved and status updated.",
      });

      onSave?.();
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to approve timeline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>
            Review and edit the generated timeline. Adjust phases, durations, and costs as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold" data-testid="text-total-weeks">{timeline.total_weeks} weeks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold" data-testid="text-total-hours">{timeline.total_hours} hrs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold" data-testid="text-total-cost">${timeline.total_cost.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {timeline.phases.map((phase, phaseIndex) => (
              <Card key={phase.id} data-testid={`card-phase-${phase.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={phase.name}
                        onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                        className="text-lg font-semibold"
                        data-testid={`input-phase-name-${phase.id}`}
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`duration-${phase.id}`}>Duration (weeks):</Label>
                          <Input
                            id={`duration-${phase.id}`}
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={phase.duration_weeks}
                            onChange={(e) => {
                              updatePhase(phase.id, { duration_weeks: parseFloat(e.target.value) || 0 });
                              recalculateTotals();
                            }}
                            className="w-24"
                            data-testid={`input-phase-duration-${phase.id}`}
                          />
                        </div>
                        {phase.dependencies.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Depends on:</span>
                            {phase.dependencies.map(dep => (
                              <Badge key={dep} variant="secondary">{dep}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhase(phase.id)}
                      data-testid={`button-remove-phase-${phase.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Tasks / Deliverables</Label>
                    {phase.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="flex gap-2">
                        <Input
                          value={task}
                          onChange={(e) => updateTask(phase.id, taskIndex, e.target.value)}
                          data-testid={`input-task-${phase.id}-${taskIndex}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTask(phase.id, taskIndex)}
                          data-testid={`button-remove-task-${phase.id}-${taskIndex}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTask(phase.id)}
                      data-testid={`button-add-task-${phase.id}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addPhase}
            className="w-full mt-4"
            data-testid="button-add-phase"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Phase
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              {timeline.assumptions.map((assumption, index) => (
                <li key={index} className="text-sm" data-testid={`text-assumption-${index}`}>
                  {assumption}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              {timeline.risks.map((risk, index) => (
                <li key={index} className="text-sm text-destructive" data-testid={`text-risk-${index}`}>
                  {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isSaving || isApproving}
          data-testid="button-save-timeline"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          onClick={handleApprove}
          disabled={isSaving || isApproving}
          data-testid="button-approve-timeline"
        >
          <Send className="h-4 w-4 mr-2" />
          {isApproving ? "Approving..." : "Approve & Send"}
        </Button>
      </div>
    </div>
  );
}
