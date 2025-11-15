import { EmptyState } from "@/components/dashboard/empty-state";

export default function MembersPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Team Members</h2>
      <EmptyState
        title="No team members yet"
        description="Invite team members to collaborate in your organization."
        actionLabel="Invite Member"
        onAction={() => {}}
      />
    </div>
  );
}
