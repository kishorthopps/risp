"use client";

import React, { use } from "react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth, useProjectOrg } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProjects";
import { useQuestionnaires } from "@/hooks/useQuestionnaires";
import { useGroups } from "@/hooks/useGroups";
import { ProtectedComponent } from "@/components/rbac/ProtectedComponent";
import {
  useAssessments,
  useAssessment,
  useCreateAssessment,
  useUpdateAssessment,
  useDeleteAssessment
} from "@/hooks/useAssessments";
import { useForms } from "@/hooks/useForms";
import { FormList } from "@/components/rfi/FormList";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Trash2, ArrowUpDown, Calendar, Users, FileText, Repeat, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type { AssessmentSchedule, DateRange, CreateAssessmentData } from "@/lib/types";

export default function AssessmentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const { } = useAuth();
  const { orgId: currentOrgId } = useProjectOrg(projectId);

  // Fetch project details dynamically using project ID
  const { data: projectData, isLoading: projectLoading } = useProject(projectId, currentOrgId || undefined);

  // Fetch questionnaires and groups for dropdowns
  const { data: questionnaires, isLoading: questionnaireLoading } = useQuestionnaires(currentOrgId || "");
  const { data: groups, isLoading: groupsLoading } = useGroups(currentOrgId || "");

  // Use hooks for assessment schedules
  const { data: assessmentSchedules, isLoading, refetch } = useAssessments(projectId, currentOrgId || "");
  const createAssessmentMutation = useCreateAssessment();
  const updateAssessmentMutation = useUpdateAssessment();
  const deleteAssessmentMutation = useDeleteAssessment();

  // Use fetched project name, fallback to "Loading..." or "Unknown Project"
  const projectName = projectData?.name || (projectLoading ? "Loading..." : "Unknown Project");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<AssessmentSchedule | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    questionnaireId: string;
    groupIds: string[]; // Multiple groups support
    dateRanges: DateRange[];
  }>({
    title: "",
    description: "",
    questionnaireId: "",
    groupIds: [],
    dateRanges: [{ startDate: "", endDate: "" }],
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  // State for view instances dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedScheduleInstances, setSelectedScheduleInstances] = useState<AssessmentSchedule | null>(null);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      questionnaireId: "",
      groupIds: [],
      dateRanges: [{ startDate: "", endDate: "" }],
    });
    setIsRecurring(false);
  };

  const addDateRange = () => {
    setFormData(prev => ({
      ...prev,
      dateRanges: [...prev.dateRanges, { startDate: "", endDate: "" }]
    }));
  };

  const removeDateRange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dateRanges: prev.dateRanges.filter((_, i) => i !== index)
    }));
  };

  const updateDateRange = (index: number, field: keyof DateRange, value: string) => {
    setFormData(prev => ({
      ...prev,
      dateRanges: prev.dateRanges.map((range, i) =>
        i === index ? { ...range, [field]: value } : range
      )
    }));
  };

  const fetchScheduleDetails = async (scheduleId: string) => {
    if (!currentOrgId) return;

    try {
      // First, let's try to find the schedule in our existing data
      const existingSchedule = assessmentSchedules?.find(s => s.id === scheduleId);

      if (existingSchedule) {
        // Extract date ranges from assessment instances
        const dateRanges: DateRange[] = existingSchedule.assessmentInstances?.map(instance => ({
          instanceId: instance.id,
          startDate: instance.startDate.split('T')[0], // Convert to YYYY-MM-DD format
          endDate: instance.endDate.split('T')[0]
        })) || [];

        setFormData({
          title: existingSchedule.title,
          description: existingSchedule.description || "",
          questionnaireId: existingSchedule.questionnaire?.id || existingSchedule.questionnaireId,
          groupIds: existingSchedule.groupIds || [],
          dateRanges: dateRanges.length > 0 ? dateRanges : [{ startDate: "", endDate: "" }],
        });

        // Set recurring state based on whether there are multiple date ranges
        setIsRecurring(dateRanges.length > 1);

        console.log("Setting formData with groupIds:", existingSchedule.groupIds);
        console.log("Available groups:", groups);

        setCurrentSchedule(existingSchedule as AssessmentSchedule);
        setIsDialogOpen(true);
        return;
      }

      // If not found in existing data, fall back to API call
      const { mcApiService } = await import("@/lib/mcApiService");

      const response = await mcApiService.get(
        `/organisations/project/${projectId}/assessments/${scheduleId}`,
        {
          headers: {
            'x-organisation-id': currentOrgId
          }
        }
      );

      const schedule = response.assessmentSchedule as AssessmentSchedule;

      if (schedule) {
        // Extract date ranges from assessment instances
        const dateRanges: DateRange[] = schedule.assessmentInstances?.map(instance => ({
          instanceId: instance.id, // Include the instance ID for updates
          startDate: instance.startDate.split('T')[0], // Convert to YYYY-MM-DD format
          endDate: instance.endDate.split('T')[0]
        })) || [];

        setFormData({
          title: schedule.title,
          description: schedule.description || "",
          questionnaireId: schedule.questionnaireId,
          groupIds: schedule.groupIds || [],
          dateRanges: dateRanges.length > 0 ? dateRanges : [{ startDate: "", endDate: "" }],
        });

        // Set recurring state based on whether there are multiple date ranges
        setIsRecurring(dateRanges.length > 1);

        setCurrentSchedule(schedule);
        setIsDialogOpen(true);
      } else {
        toast.error("Invalid response structure from the API");
      }
    } catch (error) {
      toast.error("Failed to fetch assessment schedule details");
    }
  };

  // Fetch forms from backend
  const { data: forms, isLoading: isFormsLoading } = useForms(currentOrgId || undefined, projectId);

  // Note: We are no longer using localStorage for forms, but integrating the backend API

  // Handlers for assessments (renamed from schedules in UI for clarity, but keeping variable names)
  // ... existing handlers ...

  const handleSaveSchedule = async () => {
    // ... existing save logic ...
  };

  const confirmDeleteSchedule = (id: string) => {
    // ... existing delete logic ...
  };

  const handleConfirmDelete = async () => {
    // ... existing confirm delete logic ...
  };

  const handleViewInstances = (schedule: AssessmentSchedule) => {
    // ... existing view instances logic ...
  };

  // ... (rest of the file remains largely same, just Swapping out the rendering part)

  return (
    <div className="p-4 md:p-10 mx-auto max-w-7xl">
      <div className="h-10"></div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{projectName} - RFIs</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage RFIs
          </p>
        </div>
        <ProtectedComponent requiredAction="assessments.create" orgId={currentOrgId || undefined}>
          <Button
            onClick={() => router.push(`/form-builder?returnUrl=${encodeURIComponent(`/app/${projectId}/assessments`)}&projectId=${projectId}&organisationId=${currentOrgId}`)}
            className="rounded-full px-6 py-3"
          >
            <Plus className="mr-2 h-4 w-4" /> Create RFI
          </Button>
        </ProtectedComponent>
      </div>

      {/* Forms List from Backend */}
      <FormList
        forms={forms || []}
        projectId={projectId}
        organisationId={currentOrgId || ""}
        isLoading={isFormsLoading}
      />



      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {currentSchedule ? "Edit Assessment" : "Create Assessment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Monthly Health Assessment"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose and scope of this assessment schedule..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Questionnaire Selection */}
            <div className="space-y-2">
              <Label>Questionnaire</Label>
              <Select
                value={formData.questionnaireId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, questionnaireId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a questionnaire">
                    {formData.questionnaireId && questionnaires?.find(q => q.id === formData.questionnaireId)?.title}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {questionnaireLoading ? (
                    <SelectItem value="" disabled>Loading questionnaires...</SelectItem>
                  ) : questionnaires?.length === 0 ? (
                    <SelectItem value="" disabled>No questionnaires available</SelectItem>
                  ) : (
                    questionnaires?.map((questionnaire) => (
                      <SelectItem key={questionnaire.id} value={questionnaire.id}>
                        {questionnaire.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Group Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Groups
              </Label>

              {/* Multi-select dropdown for groups */}
              <div className="relative">
                <Select
                  value={formData.groupIds.length > 0 ? "selected" : ""}
                  onValueChange={() => { }} // Controlled by individual checkboxes
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select groups">
                      {formData.groupIds.length === 0 ? (
                        "Select groups"
                      ) : formData.groupIds.length === 1 ? (
                        groups?.find(g => g.id === formData.groupIds[0])?.name || "1 group selected"
                      ) : (
                        `${formData.groupIds.length} groups selected`
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groupsLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading groups...</div>
                    ) : groups?.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No groups available</div>
                    ) : (
                      groups?.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2 p-2 hover:bg-muted cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            const isSelected = formData.groupIds.includes(group.id);
                            if (isSelected) {
                              setFormData(prev => ({
                                ...prev,
                                groupIds: prev.groupIds.filter(id => id !== group.id)
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                groupIds: [...prev.groupIds, group.id]
                              }));
                            }
                          }}>
                          <Checkbox
                            checked={formData.groupIds.includes(group.id)}
                            onCheckedChange={() => { }} // Controlled by parent click
                          />
                          <Label className="text-sm font-normal cursor-pointer flex-1">
                            {group.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected groups display */}
              {formData.groupIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.groupIds.map(groupId => {
                    const group = groups?.find(g => g.id === groupId);
                    return group ? (
                      <Badge key={groupId} variant="secondary" className="text-xs">
                        {group.name}
                        <button
                          type="button"
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              groupIds: prev.groupIds.filter(id => id !== groupId)
                            }));
                          }}
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Date Ranges */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Assessment Schedule
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => {
                      setIsRecurring(!!checked);
                      if (!checked) {
                        // Keep only the first date range when disabling recurring
                        setFormData(prev => ({
                          ...prev,
                          dateRanges: prev.dateRanges.slice(0, 1)
                        }));
                      }
                    }}
                  />
                  <Label htmlFor="recurring" className="text-sm font-medium flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    Enable recurring
                  </Label>
                </div>
              </div>

              {!isRecurring ? (
                // Single date range
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Start Date *</Label>
                        <Input
                          type="date"
                          value={formData.dateRanges[0]?.startDate || ""}
                          onChange={(e) => updateDateRange(0, 'startDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">End Date (Optional)</Label>
                        <Input
                          type="date"
                          value={formData.dateRanges[0]?.endDate || ""}
                          onChange={(e) => updateDateRange(0, 'endDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Multiple date ranges
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formData.dateRanges.length} recurrence{formData.dateRanges.length !== 1 ? 's' : ''} scheduled
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDateRange}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Date
                    </Button>
                  </div>
                  {formData.dateRanges.map((range, index) => (
                    <Card key={index} className={range.instanceId ? "border-blue-200" : "border-green-200"}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Start Date *</Label>
                              <Input
                                type="date"
                                value={range.startDate}
                                onChange={(e) => updateDateRange(index, 'startDate', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">End Date (Optional)</Label>
                              <Input
                                type="date"
                                value={range.endDate || ""}
                                onChange={(e) => updateDateRange(index, 'endDate', e.target.value)}
                              />
                            </div>
                          </div>
                          {formData.dateRanges.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDateRange(index)}
                              className={`${range.instanceId ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-700'}`}
                              title={range.instanceId ? 'Remove existing assessment (may have assignments)' : 'Remove new assessment'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> If end date is not specified, it will be auto-calculated based on the questionnaire's minimum span requirement.
                  <br />
                  <strong>Note:</strong> You cannot delete the date ranges if any existing assignments exist.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <ProtectedComponent
              requiredAction={currentSchedule ? "assessments.update" : "assessments.create"}
              orgId={currentOrgId || undefined}
            >
              <Button onClick={handleSaveSchedule}>
                {currentSchedule ? "Update Assessment" : "Create Assessment"}
              </Button>
            </ProtectedComponent>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this assessment? This will also delete all related assessment instances and cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Instances Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Assessment Instances - {selectedScheduleInstances?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              // Get instances from assessmentInstances
              const instances = selectedScheduleInstances?.assessmentInstances || [];

              if (instances.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No assessment instances found for this schedule.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">No</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Start Date</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">End Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instances
                          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                          .map((instance, index) => (
                            <tr key={`instance-${instance.id}-${index}`} className="border-t">
                              <td className="px-4 py-2 text-sm">{index + 1}</td>
                              <td className="px-4 py-2 text-sm">
                                {new Date(instance.startDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {new Date(instance.endDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 