import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-4xl font-semibold text-foreground" data-testid="text-hero-title">
            Scopebound
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-hero-tagline">
            A modern multi-tenant SaaS platform foundation
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" data-testid="button-get-started">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" data-testid="button-sign-in">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="mt-16 space-y-4 text-lg text-muted-foreground">
            <p data-testid="text-feature-1">✓ Multi-tenant architecture</p>
            <p data-testid="text-feature-2">✓ Secure authentication</p>
            <p data-testid="text-feature-3">✓ Organization management</p>
          </div>
        </div>
      </main>
    </div>
  );
}
