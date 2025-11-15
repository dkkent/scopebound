"use client";

import { createContext, useContext, ReactNode } from "react";

type Organization = {
  id: string;
  name: string;
  role: string;
};

type OrganizationContextType = {
  organization: Organization | null;
  organizations: Organization[];
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({
  children,
  organization,
  organizations,
}: {
  children: ReactNode;
  organization: Organization | null;
  organizations: Organization[];
}) {
  return (
    <OrganizationContext.Provider value={{ organization, organizations }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}
