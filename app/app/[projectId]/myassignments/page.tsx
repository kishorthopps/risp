"use client";

import { use, useState } from "react";
import { useAuth, useProjectOrg } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProjects";
import { useMyAssignments, useStartAssessment } from "@/hooks/useAssessments";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, Play, MoreHorizontal, FileText, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";

const UserLevelReport = dynamic(() => import("@/components/report/UserLevelReport"), { ssr: false });
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

interface Assignment {
  id?: string;
  assessmentInstanceId?: string;
  assessmentName: string;
  questionnaire?: {
    id: string;
    title: string;
    slug: string;
  };
  groupName?: string;
  status: string;
  type: "STARTED" | "AVAILABLE";
  startDate: string;
  endDate: string;
  submittedAt?: string;
  accessCode?: string;
  accessSecret?: string;
  responses?: any;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export default function MyAssignmentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { user } = useAuth();
  const { orgId: currentOrgId } = useProjectOrg(projectId);
  
  const { data: projectData, isLoading: projectLoading } = useProject(projectId, currentOrgId || undefined);
  const { data: assignments, isLoading: assignmentsLoading, refetch } = useMyAssignments(currentOrgId || "", projectId);
  const startAssessmentMutation = useStartAssessment();

  const projectName = projectData?.name || (projectLoading ? "Loading..." : "Unknown Project");

  // State for dialogs
  const [isAccessCodeDialogOpen, setIsAccessCodeDialogOpen] = useState(false);
  const [currentAccessCodes, setCurrentAccessCodes] = useState<{ code: string; secret: string; assessmentName: string } | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [currentResponses, setCurrentResponses] = useState<any[]>([]);
  const [currentAssessmentTitle, setCurrentAssessmentTitle] = useState<string>("");
  const [currentTotalScore, setCurrentTotalScore] = useState<number | null>(null);

  // UserLevelReport states
  const [showUserLevelReport, setShowUserLevelReport] = useState(false);
  const [userLevelReportResponses, setUserLevelReportResponses] = useState<any[]>([]);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // All assignments in one list
  const allAssignments = assignments as Assignment[] || [];

  const handleStartAssessment = async (assessmentInstanceId: string, assessmentName: string, userId?: string) => {
    if (!currentOrgId) {
      toast.error("Organization context required");
      return;
    }

    try {
      const result = await startAssessmentMutation.mutateAsync({
        orgId: currentOrgId,
        projectId,
        assessmentInstanceId,
        userId
      });

      // Show access codes
      setCurrentAccessCodes({
        code: result.assignment.accessCode,
        secret: result.assignment.accessSecret,
        assessmentName
      });
      setIsAccessCodeDialogOpen(true);
      
      // Refresh assignments
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusText = (status: string, assignment: Assignment) => {
    const today = new Date();
    const startDate = new Date(assignment.startDate);
    const endDate = new Date(assignment.endDate);
    
    if (assignment.type === "AVAILABLE") {
      if (today < startDate) {
        return "Available";
      }
      if (today > endDate) {
        return "Expired";
      }
      return "Available";
    }
    
    if (status === "COMPLETED") {
      return "Completed";
    }
    
    if (today < startDate) {
      return "Not Started";
    }
    
    if (today > endDate) {
      return "Expired";
    }
    
    switch (status) {
      case "PENDING":
        return "In Progress";
      default:
        return status;
    }
  };

  const handleOpenDirectLink = (assignment: Assignment) => {
    if (!assignment.accessCode || !assignment.accessSecret) {
      toast.error("Assessment not started yet. No access codes available.");
      return;
    }

    const directUrl = `${window.location.origin}/q?code=${assignment.accessCode}&key=${assignment.accessSecret}`;
    
    // Open the link in a new tab
    window.open(directUrl, '_blank');
    toast.success("Assessment opened in new tab!");
  };

  // Columns for All Assignments
  const columns: ColumnDef<Assignment>[] = [
    {
      accessorKey: "userName",
      header: "Student",
      cell: ({ row }) => (
        <div>
          {row.original.userName && (
            <>
              <div className="font-medium text-sm">{row.original.userName}</div>
              <div className="text-xs text-muted-foreground">{row.original.userEmail}</div>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: "assessmentName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assessment
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.assessmentName}</div>
          <div className="text-sm text-muted-foreground">{row.original.questionnaire?.slug}</div>
        </div>
      ),
    },
    {
      accessorKey: "groupName",
      header: "Group",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.groupName || 'N/A'}</span>
      ),
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString(),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => new Date(row.original.endDate).toLocaleDateString(),
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <span className="text-sm">{getStatusText(row.original.status, row.original)}</span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => 
        row.original.submittedAt 
          ? new Date(row.original.submittedAt).toLocaleDateString()
          : "Not submitted",
    },
    {
      header: "Responses",
      cell: ({ row }) => {
        const assignment = row.original;
        const responses = row.original.responses;
        
        // If the user hasn't started the assessment or it's not completed, show disabled button
        if (assignment.type === "AVAILABLE" || assignment.status !== "COMPLETED" || !assignment.responses) {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="opacity-50 p-0 h-8 w-8"
                title="No responses yet"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-8 w-8 opacity-50"
                title="No report available"
                disabled
              >
                <FileText className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const responsesArray = Array.isArray(assignment.responses) ? assignment.responses : [];
                
                // Find and set total score from the special "Final Score" object
                const finalScoreResponse = responsesArray.find((r: any) => r.question === "Final Score");
                if (finalScoreResponse && finalScoreResponse.response && typeof finalScoreResponse.response.score !== 'undefined') {
                  setCurrentTotalScore(parseInt(finalScoreResponse.response.score));
                } else {
                  setCurrentTotalScore(null);
                }

                setCurrentResponses(responsesArray);
                setCurrentAssessmentTitle(assignment.assessmentName || "Assessment");
                setIsResponseDialogOpen(true);
              }}
              title="View Responses"
              className="p-0 h-8 w-8"
            >
              <Eye className="w-4 h-4" />
            </Button>
            {/* report icon */}
            <Button
              variant="ghost"
              className="p-0 h-8 w-8"
              title="View Report"
              onClick={() => {
                const responsesArray = Array.isArray(responses) ? responses : [];
                setUserLevelReportResponses(responsesArray);
                setCurrentAssessmentTitle(assignment.questionnaire?.slug || "");
                // Set the current user name from the user context
                setCurrentUserName(user?.name || "User");
                setShowUserLevelReport(true);
              }}
            >
              <FileText className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => {
        const assignment = row.original;
        
        // If available and not started, show start button
        if (assignment.type === "AVAILABLE") {
          const isAvailable = new Date() >= new Date(assignment.startDate) && new Date() <= new Date(assignment.endDate);
          
          return (
            <Button
              onClick={() => handleStartAssessment(assignment.assessmentInstanceId!, assignment.assessmentName, assignment.userId)}
              disabled={!isAvailable || startAssessmentMutation.isPending}
              size="sm"
              className="bg-primary_orange hover:bg-primary_orange/90"
            >
              <Play className="w-4 h-4 mr-1" />
              {startAssessmentMutation.isPending ? "Starting..." : "Start"}
            </Button>
          );
        }
        
        // If started, show 3-dot menu
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setCurrentAccessCodes({
                  code: assignment.accessCode || "N/A",
                  secret: assignment.accessSecret || "N/A",
                  assessmentName: assignment.assessmentName
                });
                setIsAccessCodeDialogOpen(true);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Access Codes
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleOpenDirectLink(assignment)}
                disabled={!assignment.accessCode || !assignment.accessSecret}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Assessment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }
  ];

  if (assignmentsLoading) {
    return (
      <div className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="h-96 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 mx-auto max-w-[1440px]">
      {/* User Level Report Dialog */}
      {showUserLevelReport && (
        <UserLevelReport
          responses={userLevelReportResponses}
          assessmentName={currentAssessmentTitle}
          userName={currentUserName}
          onClose={() => setShowUserLevelReport(false)}
        />
      )}

      <div className="h-10"></div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{projectName} - My Assignments</h1>
          <p className="text-muted-foreground mt-2">
            View your available assessments and track your progress
          </p>
          {allAssignments && (
            <p className="text-sm text-muted-foreground mt-1">
              Total: {allAssignments.length} assignment{allAssignments.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Single table for all assignments */}
      {allAssignments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          <p>No assignments available at this time.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={allAssignments} />
      )}

      {/* Access Codes Dialog */}
      <Dialog open={isAccessCodeDialogOpen} onOpenChange={setIsAccessCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Assessment Access Codes
            </DialogTitle>
          </DialogHeader>
          {currentAccessCodes && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">{currentAccessCodes.assessmentName}</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Access Code</label>
                    <p className="text-lg  bg-muted p-2 rounded mt-1">{currentAccessCodes.code}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Access Secret</label>
                    <p className="text-lg  bg-muted p-2 rounded mt-1">{currentAccessCodes.secret}</p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                <p><strong>Instructions:</strong> Use these codes to access your assessment. Keep them secure and do not share them with others.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessCodeDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assessment Responses - {currentAssessmentTitle}</DialogTitle>
            {currentTotalScore !== null && (
              <p className="text-lg font-semibold mt-2">Total score = {currentTotalScore}</p>
            )}
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto p-4">
            {currentResponses.length > 0 ? (
              currentResponses
                .filter((item: any) => item.question !== "Final Score") // Filter out the score object
                .map((item: any, index: number) => (
                  <div key={index} className="border-b pb-2">
                    <p className="font-medium text-sm text-gray-700 mb-1">Q: {item.question}</p>
                    <p className="text-sm">A: {item.response}</p>
                  </div>
                ))
            ) : (
              <p>No Responses</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}