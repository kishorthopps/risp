"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Eye, Settings, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormStore } from "./store/useFormStore";
import { FormHeader } from "@/components/FormBuilder/FormHeader";
import { SectionNavigation } from "@/components/FormBuilder/SectionNavigation";
import { FormCanvas } from "@/components/FormBuilder/FormCanvas";
import { FormToolbar } from "@/components/FormBuilder/FormToolbar";
import { FormSettingsDialog } from "@/components/FormBuilder/FormSettingsDialog";
import { FieldType } from "@/types/form";
import { useCreateForm, useUpdateForm, useForm } from "@/hooks/useForms";

export default function FormBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");
  const projectId = searchParams.get("projectId");
  const organisationId = searchParams.get("organisationId");
  const returnUrl = searchParams.get("returnUrl") || "/";

  const { toast } = useToast();
  const {
    title,
    description,
    status,
    fields,
    sections,
    settings,
    activeSection,
    setActiveSection,
    addSection,
    updateSection,
    removeSection,
    addField,
    updateField,
    removeField,
    duplicateField,
    moveField,
    updateFormMetadata,
    resetForm,
    loadForm,
  } = useFormStore();
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // API Hooks
  const createFormMutation = useCreateForm();
  const updateFormMutation = useUpdateForm();
  const { data: existingForm, isLoading: isLoadingForm } = useForm(
    formId || undefined,
    organisationId || undefined
  );

  // Load existing form if formId is provided
  useEffect(() => {
    if (formId && existingForm && loadForm) {
      // Map backend form data to store format
      // existingForm has schema field which contains fields, sections, settings
      const schema = existingForm.schema;
      if (schema) {
        loadForm({
          title: existingForm.title,
          description: existingForm.description || "",
          status: existingForm.status || 'DRAFT',
          settings: schema.settings,
          sections: schema.sections,
          fields: schema.fields,
        });
      }
    } else if (!formId) {
      // Reset form for new creation
      resetForm();
    }
  }, [formId, existingForm, loadForm]);

  const handleSave = async () => {
    console.log("handleSave called");
    console.log("Context:", { projectId, organisationId, formId });

    if (!projectId || !organisationId) {
      console.error("Missing context:", { projectId, organisationId });
      toast({
        title: "Error",
        description: "Missing project or organisation context.",
        variant: "destructive"
      });
      return;
    }

    // Build schema object
    const schema = {
      settings: {
        numberingEnabled: settings.numberingEnabled,
        numberingSystem: settings.numberingSystem,
        gridSectionNumberingEnabled: settings.gridSectionNumberingEnabled,
        gridSectionNumberingSystem: settings.gridSectionNumberingSystem,
        gridItemNumberingEnabled: settings.gridItemNumberingEnabled,
        gridItemNumberingSystem: settings.gridItemNumberingSystem,
      },
      sections: sections.map(section => ({
        id: section.id,
        title: section.title,
        icon: section.icon,
      })),
      fields: fields,
    };

    try {
      if (formId) {
        await updateFormMutation.mutateAsync({
          id: formId,
          organisationId,
          projectId,
          data: {
            title: title || "Untitled Form",
            description,
            status,
            schema
          }
        });
      } else {
        await createFormMutation.mutateAsync({
          title: title || "Untitled Form",
          description,
          status,
          schema,
          organisationId,
          projectId
        });
      }

      toast({
        title: "Form Saved",
        description: "Form has been saved successfully.",
      });

      // Navigate back
      router.push(returnUrl);

    } catch (error) {
      console.error("Save failed:", error);
      // Error handled by mutation hook
    }
  };

  const handleAddField = (type: FieldType = 'text', index?: number) => {
    const newFieldId = addField(type, activeSection, index);
    setActiveFieldId(newFieldId);
  };

  const filteredFields = fields.filter(f => f.section === activeSection);

  if (isLoadingForm) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background" onClick={() => setActiveFieldId(null)}>
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(returnUrl)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <Input
              value={title}
              onChange={(e) => updateFormMetadata({ title: e.target.value })}
              className="text-center font-medium border-transparent hover:border-input focus:border-input transition-colors bg-transparent"
              placeholder="Untitled Form"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              title="Form Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const params = new URLSearchParams();
                if (formId) params.set("formId", formId);
                if (organisationId) params.set("organisationId", organisationId);
                if (projectId) params.set("projectId", projectId);
                if (returnUrl) params.set("returnUrl", returnUrl);
                router.push(`/form-preview?${params.toString()}`);
              }}
              title="Preview Form"
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Form
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)_auto] gap-8 items-start relative">
          <div className="sticky top-24">
            <SectionNavigation
              sections={sections}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              onAddSection={addSection}
              onUpdateSection={updateSection}
              onRemoveSection={removeSection}
            />
          </div>

          <div className="space-y-8">
            {sections.length > 0 && activeSection === sections[0].id && (
              <FormHeader
                title={title}
                description={description}
                status={status}
                onUpdate={updateFormMetadata}
              />
            )}

            <FormCanvas
              fields={filteredFields}
              onReorder={moveField}
              onUpdate={updateField}
              onDelete={removeField}
              onDuplicate={duplicateField}
              onAddBelow={(index) => handleAddField('text', index)}
              activeFieldId={activeFieldId}
              setActiveFieldId={setActiveFieldId}
              onAddFirst={() => handleAddField('text')}
              onAddField={(type, index) => handleAddField(type, index)}
              onAddSection={(index) => handleAddField('section', index)}
            />
          </div>
        </div>
      </div>
      <FormSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
