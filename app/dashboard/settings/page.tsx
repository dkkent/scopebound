import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Settings</h2>
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="My Organization"
                data-testid="input-org-name"
              />
            </div>
            <Button data-testid="button-save-settings">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                placeholder="Your Name"
                data-testid="input-user-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="you@example.com"
                data-testid="input-user-email"
              />
            </div>
            <Button data-testid="button-save-profile">Save Profile</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
