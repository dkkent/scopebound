"use client";

import { useState } from "react";
import { Home, Settings, Users, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { OrganizationWithRole } from "@/lib/types";

interface SidebarProps {
  user: {
    name: string;
    email: string;
  };
  currentOrganization: OrganizationWithRole;
  organizations: OrganizationWithRole[];
}

export function Sidebar({ user, currentOrganization, organizations }: SidebarProps) {
  const router = useRouter();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard", testId: "nav-home" },
    { icon: Users, label: "Members", href: "/dashboard/members", testId: "nav-members" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings", testId: "nav-settings" },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleOrgSwitch = async (orgId: string) => {
    await fetch("/api/organizations/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId }),
    });
    setShowOrgDropdown(false);
    router.refresh();
  };

  return (
    <div className="w-64 h-screen bg-background border-r border-border flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold">Scopebound</h2>
      </div>

      {/* Organization Switcher */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-md hover:bg-accent transition-colors"
            data-testid="button-org-switcher"
          >
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">{currentOrganization.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {currentOrganization.role}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {showOrgDropdown && (
            <div className="absolute top-full mt-2 w-full bg-popover border border-border rounded-md shadow-lg z-50">
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Your Organizations
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgSwitch(org.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
                    data-testid={`org-option-${org.id}`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{org.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {org.role}
                      </span>
                    </div>
                    {org.id === currentOrganization.id && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent transition-colors text-foreground"
              data-testid={item.testId}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start mt-2"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
