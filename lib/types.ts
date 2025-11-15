// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

// Organization Member types
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: "owner" | "member";
  createdAt: string;
}

// Extended types for frontend
export interface UserWithOrganizations extends User {
  organizations: OrganizationWithRole[];
}

export interface OrganizationWithRole extends Organization {
  role: "owner" | "member";
  memberCount?: number;
}

// Form types
export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}
