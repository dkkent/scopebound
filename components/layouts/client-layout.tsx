interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold">Scopebound</h1>
        </div>
      </header>

      {/* Main content - centered and clean */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t bg-muted/40 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by Scopebound</p>
        </div>
      </footer>
    </div>
  );
}
