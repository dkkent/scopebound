"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, FileText, Zap } from "lucide-react";

interface UsageStats {
  projectsCreated: number;
  formsSent: number;
  timelinesGenerated: number;
}

export function BillingSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats>({
    projectsCreated: 0,
    formsSent: 0,
    timelinesGenerated: 0,
  });

  useEffect(() => {
    async function fetchUsageStats() {
      try {
        const response = await fetch("/api/organization/usage");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch usage stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsageStats();
  }, []);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading billing information...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Card data-testid="card-current-plan">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription className="mt-2">
                Manage your subscription and billing details
              </CardDescription>
            </div>
            <Badge variant="default" className="text-base px-4 py-2">
              Free Plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What's included:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Unlimited projects
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  AI-powered client intake forms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Project timeline generation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Basic team collaboration
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <Button disabled data-testid="button-upgrade-plan">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade to Pro (Coming Soon)
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Stripe integration will be available in a future update
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-usage-stats">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription>
            Your organization's usage this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4" data-testid="stat-projects">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Projects Created</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-projects-count">
                    {stats.projectsCreated}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            <div className="rounded-lg border p-4" data-testid="stat-forms">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Forms Sent</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-forms-count">
                    {stats.formsSent}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            <div className="rounded-lg border p-4" data-testid="stat-timelines">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Timelines Generated</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-timelines-count">
                    {stats.timelinesGenerated}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Manage your payment methods and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="mb-4">No payment method required for the free plan</p>
            <p className="text-sm">
              Payment processing via Stripe will be available when premium plans are launched
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
