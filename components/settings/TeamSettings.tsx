"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, Trash2, Clock } from "lucide-react";

interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface OrganizationInvite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export function TeamSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "owner">("member");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const [membersRes, invitesRes] = await Promise.all([
          fetch("/api/organization/members"),
          fetch("/api/organization/invites"),
        ]);

        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data);
        }

        if (invitesRes.ok) {
          const data = await invitesRes.json();
          setInvites(data);
        }
      } catch (error) {
        console.error("Failed to fetch team:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeam();
  }, []);

  const handleSendInvite = async () => {
    setIsSending(true);
    try {
      const response = await fetch("/api/organization/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invite");
      }

      const invite = await response.json();
      setInvites([...invites, invite]);

      toast({
        title: "Invitation sent",
        description: `Invite sent to ${inviteEmail}`,
      });

      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
    } catch (error: any) {
      console.error("Failed to send invite:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/organization/members/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to change role");
      }

      setMembers(members.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ));

      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to change role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update role. Please try again.",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      const response = await fetch(`/api/organization/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      setMembers(members.filter(m => m.id !== memberId));

      toast({
        title: "Member removed",
        description: "Member has been removed from the organization.",
      });
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member. Please try again.",
      });
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/organization/invites/${inviteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel invite");
      }

      setInvites(invites.filter(i => i.id !== inviteId));

      toast({
        title: "Invite cancelled",
        description: "The invitation has been cancelled.",
      });
    } catch (error) {
      console.error("Failed to cancel invite:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel invite. Please try again.",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading team...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Card data-testid="card-members">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription className="mt-2">
                Manage your organization members and their roles
              </CardDescription>
            </div>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-invite-member">
                  <Mail className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation email to add a new member to your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      data-testid="input-invite-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value: "member" | "owner") => setInviteRole(value)}>
                      <SelectTrigger id="invite-role" data-testid="select-invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Owners have full access to all settings
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsInviteDialogOpen(false)}
                    data-testid="button-cancel-invite"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendInvite}
                    disabled={isSending || !inviteEmail}
                    data-testid="button-send-invite"
                  >
                    {isSending ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} data-testid={`member-row-${member.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid={`member-name-${member.id}`}>
                          {member.user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleChangeRole(member.id, value)}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-role-${member.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      data-testid={`button-remove-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card data-testid="card-pending-invites">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              Invitations that have been sent but not yet accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id} data-testid={`invite-row-${invite.id}`}>
                    <TableCell data-testid={`invite-email-${invite.id}`}>
                      {invite.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invite.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                        data-testid={`button-cancel-${invite.id}`}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
