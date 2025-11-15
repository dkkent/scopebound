import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserMenu } from "@/components/dashboard/user-menu";

async function checkAuth() {
  const requestHeaders = await headers();
  console.log('[Dashboard] Checking auth...');
  console.log('[Dashboard] Cookie header:', requestHeaders.get('cookie'));
  
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  console.log('[Dashboard] Session result:', session ? 'exists' : 'null');
  console.log('[Dashboard] User:', session?.user ? 'exists' : 'null');

  if (!session || !session.user) {
    console.log('[Dashboard] No valid session, redirecting to login');
    redirect("/login");
  }

  return {
    user: session.user,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await checkAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Scopebound</h1>
          <UserMenu userName={user.name} userEmail={user.email} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
