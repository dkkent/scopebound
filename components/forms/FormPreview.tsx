"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Send, Edit } from "lucide-react";
import type { FormSchema } from "./FormRenderer";

interface FormPreviewProps {
  formSchema: FormSchema;
  onSendToClient?: () => void;
  onEditForm?: () => void;
  isSending?: boolean;
  readOnly?: boolean;
}

export function FormPreview({
  formSchema,
  onSendToClient,
  onEditForm,
  isSending = false,
  readOnly = false,
}: FormPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Action buttons */}
      {!readOnly && (onEditForm || onSendToClient) && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card">
          <div>
            <h3 className="font-semibold">Form Preview</h3>
            <p className="text-sm text-muted-foreground">
              Review the AI-generated questionnaire before sending to your client
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEditForm && (
              <Button
                variant="outline"
                onClick={onEditForm}
                data-testid="button-edit-form"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Form
              </Button>
            )}
            {onSendToClient && (
              <Button
                onClick={onSendToClient}
                disabled={isSending}
                data-testid="button-send-to-client"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send to Client"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Form sections */}
      {formSchema.sections.map((section, sectionIdx) => (
        <Card key={sectionIdx}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>{section.title}</CardTitle>
                {section.description && (
                  <CardDescription className="mt-2">{section.description}</CardDescription>
                )}
              </div>
              <Badge variant="secondary" data-testid={`badge-section-${sectionIdx}`}>
                {section.questions.length} {section.questions.length === 1 ? "Question" : "Questions"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.questions.map((question, questionIdx) => (
              <div key={question.id} className="space-y-3">
                {/* Question label */}
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground mt-0.5">
                    {questionIdx + 1}.
                  </span>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">
                      {question.label}
                      {question.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </h4>
                    {question.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {question.description}
                      </p>
                    )}
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {question.type === "radio" && "Single Choice"}
                        {question.type === "checkbox" && "Multiple Choice"}
                        {question.type === "text" && "Short Answer"}
                        {question.type === "textarea" && "Long Answer"}
                        {question.type === "select" && "Dropdown"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Options (for radio, checkbox, select) */}
                {question.options && question.options.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {question.options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-start gap-3 p-3 rounded-md border bg-muted/50"
                        data-testid={`preview-option-${question.id}-${option.value}`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">{option.label}</div>
                          {option.impact && (
                            <div className="flex items-center gap-2 mt-2 p-2 rounded bg-background border border-primary/20">
                              <Info className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="text-xs text-foreground font-medium">
                                Impact: {option.impact}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Placeholder for text/textarea */}
                {(question.type === "text" || question.type === "textarea") && (
                  <div className="ml-6">
                    <div className="p-3 rounded-md border bg-muted/30 text-sm text-muted-foreground italic">
                      {question.placeholder || "Client will provide a written response"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
