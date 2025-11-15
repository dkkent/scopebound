"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormRenderer, type FormSchema } from "@/components/forms/FormRenderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  formId: string;
  formData: FormSchema;
  projectName: string;
  clientName: string;
  clientEmail: string | null;
}

export default function PublicFormPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const shareToken = params.shareToken as string;

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [clientEmail, setClientEmail] = useState("");

  // Fetch form data
  useEffect(() => {
    async function fetchForm() {
      try {
        const response = await fetch(`/api/forms/${shareToken}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 410) {
            setError("This form has already been submitted. Thank you!");
          } else {
            setError(data.error || "Form not found");
          }
          setLoading(false);
          return;
        }

        setFormData(data);
        setClientEmail(data.clientEmail || "");
        setLoading(false);
      } catch (err) {
        console.error("Failed to load form:", err);
        setError("Failed to load form. Please try again later.");
        setLoading(false);
      }
    }

    if (shareToken) {
      fetchForm();
    }
  }, [shareToken]);

  // Handle form submission
  async function handleSubmit(responses: Record<string, any>) {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/forms/${shareToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          clientEmail: clientEmail || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit form");
      }

      setSubmitted(true);
      toast({
        title: "Success!",
        description: "Your responses have been submitted successfully.",
      });
    } catch (err: any) {
      console.error("Submit error:", err);
      toast({
        title: "Submission failed",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Unable to Load Form</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            {error.includes("already been submitted") && (
              <p className="mt-4 text-sm">
                If you need to make changes, please contact the project team directly.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Thank You!</CardTitle>
                <CardDescription>Your responses have been submitted</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We've received your responses for <strong>{formData?.projectName}</strong>.
              The project team will review your input and get back to you soon.
            </p>
            {clientEmail && (
              <p className="text-sm text-muted-foreground">
                A confirmation has been sent to <strong>{clientEmail}</strong>
              </p>
            )}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Powered by <span className="font-semibold">Scopebound</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold" data-testid="text-project-name">
            {formData?.projectName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Client Intake Questionnaire for {formData?.clientName}
          </p>
        </div>
      </div>

      {/* Form content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Email input (if not pre-filled) */}
        {!formData?.clientEmail && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
              <CardDescription>
                Please provide your email address so we can follow up with you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="client-email">Email Address *</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="your@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  data-testid="input-client-email"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form renderer */}
        {formData && (
          <FormRenderer
            formSchema={formData.formData}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            submitButtonText="Submit Responses"
          />
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold">Scopebound</span>
          </p>
        </div>
      </div>
    </div>
  );
}
