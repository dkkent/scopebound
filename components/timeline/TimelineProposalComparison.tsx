'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, ChevronRight, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Proposal {
  id: string;
  summary: string;
  deltaCost: number;
  deltaWeeks: number;
  proposalData: {
    changes: string[];
    reasoning: string;
  };
  status: string;
}

interface TimelineProposalComparisonProps {
  proposalId: string;
  shareToken: string;
  currentTimeline: {
    total_cost: number;
    total_weeks: number;
  };
  onClose: () => void;
  onRequestChangeOrder: (proposalId: string, clientEmail?: string) => void;
  clientEmail?: string;
}

export function TimelineProposalComparison({
  proposalId,
  shareToken,
  currentTimeline,
  onClose,
  onRequestChangeOrder,
  clientEmail,
}: TimelineProposalComparisonProps) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      const response = await fetch(`/api/timelines/${shareToken}/chat`);
      if (response.ok) {
        const data = await response.json();
        const foundProposal = data.proposals?.find((p: Proposal) => p.id === proposalId);
        if (foundProposal) {
          setProposal(foundProposal);
        } else {
          toast({
            title: 'Proposal not found',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to load proposal details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Proposal not found
      </div>
    );
  }

  const proposedCost = currentTimeline.total_cost + proposal.deltaCost;
  const proposedWeeks = currentTimeline.total_weeks + proposal.deltaWeeks;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Scope Change Proposal</h3>
          <p className="text-sm text-muted-foreground">{proposal.summary}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-comparison">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h4 className="text-sm font-medium mb-3">Proposed Changes</h4>
          <ul className="space-y-2">
            {proposal.proposalData.changes.map((change, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm"
                data-testid={`change-${index}`}
              >
                <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Current Timeline</div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold" data-testid="text-current-weeks">
                {currentTimeline.total_weeks}
              </span>
              <span className="text-muted-foreground">weeks</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" data-testid="text-current-cost">
                ${currentTimeline.total_cost.toLocaleString()}
              </span>
            </div>
          </Card>

          <Card className="p-4 border-primary">
            <div className="text-sm text-muted-foreground mb-1">Proposed Timeline</div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-primary" data-testid="text-proposed-weeks">
                {proposedWeeks.toFixed(1)}
              </span>
              <span className="text-muted-foreground">weeks</span>
              {proposal.deltaWeeks !== 0 && (
                <Badge
                  variant={proposal.deltaWeeks > 0 ? 'destructive' : 'default'}
                  className="text-xs"
                >
                  {proposal.deltaWeeks > 0 ? '+' : ''}
                  {proposal.deltaWeeks}w
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-primary" data-testid="text-proposed-cost">
                ${proposedCost.toLocaleString()}
              </span>
              {proposal.deltaCost !== 0 && (
                <Badge
                  variant={proposal.deltaCost > 0 ? 'destructive' : 'default'}
                  className="text-xs"
                >
                  {proposal.deltaCost > 0 ? '+' : ''}${Math.abs(proposal.deltaCost).toLocaleString()}
                </Badge>
              )}
            </div>
          </Card>
        </section>

        <section>
          <h4 className="text-sm font-medium mb-2">Impact Analysis</h4>
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Timeline Impact</div>
                  <div className="text-sm text-muted-foreground">
                    {proposal.deltaWeeks === 0 ? (
                      'No change to timeline'
                    ) : proposal.deltaWeeks > 0 ? (
                      <>
                        Timeline extended by <span className="font-medium text-destructive">{proposal.deltaWeeks} weeks</span>
                      </>
                    ) : (
                      <>
                        Timeline reduced by <span className="font-medium text-green-600">{Math.abs(proposal.deltaWeeks)} weeks</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Cost Impact</div>
                  <div className="text-sm text-muted-foreground">
                    {proposal.deltaCost === 0 ? (
                      'No change to cost'
                    ) : proposal.deltaCost > 0 ? (
                      <>
                        Additional investment of <span className="font-medium text-destructive">${proposal.deltaCost.toLocaleString()}</span>
                      </>
                    ) : (
                      <>
                        Cost savings of <span className="font-medium text-green-600">${Math.abs(proposal.deltaCost).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h4 className="text-sm font-medium mb-2">Reasoning</h4>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {proposal.proposalData.reasoning}
            </p>
          </Card>
        </section>
      </div>

      <div className="p-4 border-t space-y-2">
        <Button
          className="w-full"
          onClick={() => onRequestChangeOrder(proposalId, clientEmail)}
          data-testid="button-request-change-order"
        >
          Request This Change
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          A change order request will be sent to the team for approval
        </p>
      </div>
    </div>
  );
}
