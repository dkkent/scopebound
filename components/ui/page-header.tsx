import { cn } from "@/lib/utils";

interface PageHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  heading,
  text,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="page-heading">{heading}</h1>
        {text && <p className="text-muted-foreground" data-testid="page-description">{text}</p>}
      </div>
      {children && <div className="flex items-center space-x-2">{children}</div>}
    </div>
  );
}
