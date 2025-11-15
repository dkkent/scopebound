"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

// Types for form schema
export interface FormOption {
  label: string;
  value: string;
  impact?: string;
}

export interface FormQuestion {
  id: string;
  type: "radio" | "checkbox" | "text" | "textarea" | "select";
  label: string;
  description?: string;
  options?: FormOption[];
  required?: boolean;
  placeholder?: string;
}

export interface FormSection {
  title: string;
  description?: string;
  questions: FormQuestion[];
}

export interface FormSchema {
  sections: FormSection[];
}

interface FormRendererProps {
  formSchema: FormSchema;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  isSubmitting?: boolean;
  submitButtonText?: string;
  defaultValues?: Record<string, any>;
}

// Build dynamic Zod schema from form structure
function buildValidationSchema(formSchema: FormSchema) {
  const shape: Record<string, z.ZodTypeAny> = {};

  formSchema.sections.forEach((section) => {
    section.questions.forEach((question) => {
      if (question.type === "checkbox") {
        // Checkbox is an array of strings
        const checkboxSchema = z.array(z.string());
        shape[question.id] = question.required 
          ? checkboxSchema.min(1, "Please select at least one option")
          : checkboxSchema.optional();
      } else if (question.type === "textarea" || question.type === "text") {
        // Text fields are strings
        const textSchema = z.string();
        shape[question.id] = question.required
          ? textSchema.min(1, "This field is required")
          : textSchema.optional();
      } else {
        // Radio and select are single strings
        const stringSchema = z.string();
        shape[question.id] = question.required
          ? stringSchema.min(1, "Please select an option")
          : stringSchema.optional();
      }
    });
  });

  return z.object(shape);
}

// Build default values from form structure
function buildDefaultValues(formSchema: FormSchema, providedDefaults?: Record<string, any>) {
  const defaults: Record<string, any> = {};

  formSchema.sections.forEach((section) => {
    section.questions.forEach((question) => {
      if (providedDefaults && providedDefaults[question.id] !== undefined) {
        defaults[question.id] = providedDefaults[question.id];
      } else if (question.type === "checkbox") {
        // Checkboxes default to empty array
        defaults[question.id] = [];
      } else if (question.required) {
        // Required fields default to empty string
        defaults[question.id] = "";
      } else {
        // Optional fields default to undefined
        defaults[question.id] = undefined;
      }
    });
  });

  return defaults;
}

export function FormRenderer({
  formSchema,
  onSubmit,
  isSubmitting = false,
  submitButtonText = "Submit",
  defaultValues: providedDefaults,
}: FormRendererProps) {
  const validationSchema = buildValidationSchema(formSchema);
  const defaultValues = buildDefaultValues(formSchema, providedDefaults);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  // Filter out undefined/empty values before submission
  const handleFormSubmit = (data: Record<string, any>) => {
    const filteredData: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      const value = data[key];
      // Keep the value if it's not undefined and not an empty string
      if (value !== undefined && value !== "") {
        filteredData[key] = value;
      }
    });
    onSubmit(filteredData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        {formSchema.sections.map((section, sectionIdx) => (
          <Card key={sectionIdx}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.description && (
                <CardDescription>{section.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {section.questions.map((question) => (
                <FormField
                  key={question.id}
                  control={form.control}
                  name={question.id}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {question.label}
                        {question.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </FormLabel>
                      {question.description && (
                        <FormDescription>{question.description}</FormDescription>
                      )}
                      <FormControl>
                        {question.type === "radio" && question.options ? (
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-3"
                          >
                            {question.options.map((option) => (
                              <div
                                key={option.value}
                                className="flex items-start space-x-3 rounded-md border p-3 hover-elevate"
                              >
                                <RadioGroupItem
                                  value={option.value}
                                  id={`${question.id}-${option.value}`}
                                  className="mt-1"
                                  data-testid={`radio-${question.id}-${option.value}`}
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`${question.id}-${option.value}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {option.label}
                                  </label>
                                  {option.impact && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {option.impact}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : question.type === "checkbox" && question.options ? (
                          <div className="space-y-3">
                            {question.options.map((option) => (
                              <div
                                key={option.value}
                                className="flex items-start space-x-3 rounded-md border p-3 hover-elevate"
                              >
                                <Checkbox
                                  checked={field.value?.includes(option.value)}
                                  onCheckedChange={(checked: boolean) => {
                                    const currentValues = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValues, option.value]);
                                    } else {
                                      field.onChange(
                                        currentValues.filter((v: string) => v !== option.value)
                                      );
                                    }
                                  }}
                                  id={`${question.id}-${option.value}`}
                                  className="mt-1"
                                  data-testid={`checkbox-${question.id}-${option.value}`}
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`${question.id}-${option.value}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {option.label}
                                  </label>
                                  {option.impact && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {option.impact}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : question.type === "select" && question.options ? (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger data-testid={`select-${question.id}`}>
                              <SelectValue placeholder={question.placeholder || "Select an option"} />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  data-testid={`select-option-${question.id}-${option.value}`}
                                >
                                  <div>
                                    <div>{option.label}</div>
                                    {option.impact && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {option.impact}
                                      </div>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : question.type === "textarea" ? (
                          <Textarea
                            placeholder={question.placeholder || ""}
                            {...field}
                            data-testid={`textarea-${question.id}`}
                            rows={4}
                          />
                        ) : (
                          <Input
                            placeholder={question.placeholder || ""}
                            {...field}
                            data-testid={`input-${question.id}`}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            data-testid="button-submit-form"
          >
            {isSubmitting ? "Submitting..." : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
