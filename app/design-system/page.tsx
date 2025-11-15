import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Design System - Scopebound",
  description: "UI component library and design tokens",
};

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <PageHeader
        heading="Design System"
        text="Complete UI component library with examples"
      />

      {/* Colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-primary" data-testid="color-swatch-primary" />
            <p className="text-sm font-medium" data-testid="color-label-primary">Primary</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-secondary" data-testid="color-swatch-secondary" />
            <p className="text-sm font-medium" data-testid="color-label-secondary">Secondary</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-accent" data-testid="color-swatch-accent" />
            <p className="text-sm font-medium" data-testid="color-label-accent">Accent</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-destructive" data-testid="color-swatch-destructive" />
            <p className="text-sm font-medium" data-testid="color-label-destructive">Destructive</p>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Typography</h2>
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <code className="text-xs text-muted-foreground">text-4xl font-bold</code>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Heading 2</h2>
            <code className="text-xs text-muted-foreground">text-2xl font-bold</code>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Heading 3</h3>
            <code className="text-xs text-muted-foreground">text-lg font-semibold</code>
          </div>
          <div>
            <p className="text-base">Body text - The quick brown fox jumps over the lazy dog</p>
            <code className="text-xs text-muted-foreground">text-base</code>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Small text - Supporting information</p>
            <code className="text-xs text-muted-foreground">text-sm text-muted-foreground</code>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button data-testid="button-variant-default">Default Button</Button>
          <Button variant="secondary" data-testid="button-variant-secondary">Secondary</Button>
          <Button variant="outline" data-testid="button-variant-outline">Outline</Button>
          <Button variant="ghost" data-testid="button-variant-ghost">Ghost</Button>
          <Button variant="destructive" data-testid="button-variant-destructive">Destructive</Button>
          <Button disabled data-testid="button-variant-disabled">Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button size="sm" data-testid="button-size-small">Small</Button>
          <Button size="default" data-testid="button-size-default">Default</Button>
          <Button size="lg" data-testid="button-size-large">Large</Button>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge data-testid="badge-default">Default</Badge>
          <Badge variant="secondary" data-testid="badge-secondary">Secondary</Badge>
          <Badge variant="outline" data-testid="badge-outline">Outline</Badge>
          <Badge variant="destructive" data-testid="badge-destructive">Destructive</Badge>
          <Badge variant="success" data-testid="badge-success">Success</Badge>
          <Badge variant="warning" data-testid="badge-warning">Warning</Badge>
        </div>
      </section>

      {/* Avatars */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Avatars</h2>
        <div className="flex gap-4">
          <Avatar data-testid="avatar-1">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar data-testid="avatar-2">
            <AvatarFallback className="bg-primary text-primary-foreground">AB</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12" data-testid="avatar-3">
            <AvatarFallback>CD</AvatarFallback>
          </Avatar>
        </div>
      </section>

      {/* Form Elements */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Form Elements</h2>
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" data-testid="input-email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="select">Select</Label>
            <Select>
              <SelectTrigger id="select" data-testid="select-trigger-example">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1" data-testid="select-option-1">Option 1</SelectItem>
                <SelectItem value="option2" data-testid="select-option-2">Option 2</SelectItem>
                <SelectItem value="option3" data-testid="select-option-3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="textarea">Textarea</Label>
            <Textarea id="textarea" placeholder="Type your message here" data-testid="textarea-example" />
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Cards</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is the card content area.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Another Card</CardTitle>
              <CardDescription>With different content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm" data-testid="text-metric-1-label">Metric 1</span>
                  <Badge data-testid="badge-metric-1-value">100</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" data-testid="text-metric-2-label">Metric 2</span>
                  <Badge variant="secondary" data-testid="badge-metric-2-value">50</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tabs</h2>
        <Tabs defaultValue="tab1" className="w-full max-w-2xl" data-testid="tabs-example">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="tab-trigger-1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" data-testid="tab-trigger-2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3" data-testid="tab-trigger-3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="space-y-4" data-testid="tab-content-1">
            <p>Content for tab 1</p>
          </TabsContent>
          <TabsContent value="tab2" className="space-y-4" data-testid="tab-content-2">
            <p>Content for tab 2</p>
          </TabsContent>
          <TabsContent value="tab3" className="space-y-4" data-testid="tab-content-3">
            <p>Content for tab 3</p>
          </TabsContent>
        </Tabs>
      </section>

      {/* Tables */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tables</h2>
        <Table>
          <TableCaption>A list of recent projects</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow data-testid="table-row-1">
              <TableCell className="font-medium" data-testid="cell-id-1">001</TableCell>
              <TableCell data-testid="cell-name-1">Project Alpha</TableCell>
              <TableCell data-testid="cell-status-1"><Badge variant="success">Active</Badge></TableCell>
              <TableCell className="text-right" data-testid="cell-amount-1">$2,500.00</TableCell>
            </TableRow>
            <TableRow data-testid="table-row-2">
              <TableCell className="font-medium" data-testid="cell-id-2">002</TableCell>
              <TableCell data-testid="cell-name-2">Project Beta</TableCell>
              <TableCell data-testid="cell-status-2"><Badge variant="warning">Pending</Badge></TableCell>
              <TableCell className="text-right" data-testid="cell-amount-2">$1,800.00</TableCell>
            </TableRow>
            <TableRow data-testid="table-row-3">
              <TableCell className="font-medium" data-testid="cell-id-3">003</TableCell>
              <TableCell data-testid="cell-name-3">Project Gamma</TableCell>
              <TableCell data-testid="cell-status-3"><Badge>Draft</Badge></TableCell>
              <TableCell className="text-right" data-testid="cell-amount-3">$3,200.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Spacing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Spacing Scale</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-1 h-4 bg-primary" data-testid="spacing-bar-1" />
            <code className="text-sm" data-testid="spacing-label-1">spacing-1 (4px)</code>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-4 bg-primary" data-testid="spacing-bar-2" />
            <code className="text-sm" data-testid="spacing-label-2">spacing-2 (8px)</code>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-primary" data-testid="spacing-bar-4" />
            <code className="text-sm" data-testid="spacing-label-4">spacing-4 (16px)</code>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-4 bg-primary" data-testid="spacing-bar-6" />
            <code className="text-sm" data-testid="spacing-label-6">spacing-6 (24px)</code>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-4 bg-primary" data-testid="spacing-bar-8" />
            <code className="text-sm" data-testid="spacing-label-8">spacing-8 (32px)</code>
          </div>
        </div>
      </section>
    </div>
  );
}
