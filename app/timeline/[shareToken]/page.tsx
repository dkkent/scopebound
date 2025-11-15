import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { TimelinePageClient } from "@/components/timeline/TimelinePageClient";
import { db } from "@/lib/db";
import { projectTimelines, projects } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface TimelinePageProps {
  params: Promise<{ shareToken: string }>;
}

const getTimeline = cache(async (shareToken: string) => {
  try {
    const result = await db
      .select({
        timeline: projectTimelines,
        project: projects,
      })
      .from(projectTimelines)
      .innerJoin(projects, eq(projectTimelines.projectId, projects.id))
      .where(eq(projectTimelines.shareToken, shareToken))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    if (result[0].project.status !== "approved") {
      return null;
    }

    return {
      timeline: result[0].timeline,
      project: {
        name: result[0].project.name,
        clientName: result[0].project.clientName,
        projectType: result[0].project.projectType,
        projectBrief: result[0].project.projectBrief,
      },
    };
  } catch (error) {
    console.error("Failed to fetch timeline:", error);
    return null;
  }
});

export async function generateMetadata({ params }: TimelinePageProps): Promise<Metadata> {
  const { shareToken } = await params;
  const data = await getTimeline(shareToken);

  if (!data) {
    return {
      title: "Timeline Not Found",
      description: "This timeline link may be invalid or the timeline has not been approved yet.",
    };
  }

  const { project, timeline } = data;
  const title = `${project.name} - Project Timeline`;
  
  // Extract timeline details for rich description
  const timelineData = timeline.timelineData as any;
  const phases = timelineData?.phases?.length || 0;
  const weeks = timeline.totalWeeks ? parseFloat(timeline.totalWeeks as string) : 0;
  const cost = timeline.totalCost ? parseFloat(timeline.totalCost as string) : 0;
  
  const description = `Project timeline for ${project.name} (${project.clientName}). ${phases} phases spanning ${weeks.toFixed(1)} weeks with estimated investment of $${cost.toFixed(0)}. View detailed breakdown of deliverables, milestones, and cost estimates.`;
  
  // Build absolute URL from request headers
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:5000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const url = `${baseUrl}/timeline/${shareToken}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Scopebound",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { shareToken } = await params;
  const data = await getTimeline(shareToken);

  if (!data) {
    notFound();
  }

  const { timeline, project } = data;

  // Validate and normalize timeline data structure
  let timelineData: any;
  
  if (typeof timeline.timelineData === 'string') {
    try {
      timelineData = JSON.parse(timeline.timelineData);
    } catch (error) {
      console.error("Failed to parse timeline JSON:", error);
      notFound();
    }
  } else {
    timelineData = timeline.timelineData;
  }

  if (!timelineData || typeof timelineData !== 'object') {
    console.error("Invalid timeline data structure:", timelineData);
    notFound();
  }

  // Normalize timeline data to expected format (snake_case)
  const normalizedTimeline = {
    phases: Array.isArray(timelineData.phases) ? timelineData.phases : [],
    total_weeks: parseFloat(timeline.totalWeeks as string) || 0,
    total_hours: parseFloat(timeline.totalHours as string) || 0,
    total_cost: parseFloat(timeline.totalCost as string) || 0,
    assumptions: Array.isArray(timelineData.assumptions) ? timelineData.assumptions : [],
    risks: Array.isArray(timelineData.risks) ? timelineData.risks : [],
  };

  return <TimelinePageClient timeline={normalizedTimeline} project={project} />;
}
