import { EmptyState } from "@/components/dashboard/empty-state";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <EmptyState
        title="Welcome to Scopebound"
        description="Your dashboard is ready. Start by inviting team members or exploring your organization settings."
        actionLabel="Get Started"
        onAction={() => {}}
      />
    </div>
  );
}
