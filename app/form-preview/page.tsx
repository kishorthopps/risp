"use client";

import { useState } from "react";
import { ChecklistRenderer } from "@/components/FormBuilder/ChecklistRenderer";
import { ImageFieldPreview } from "@/components/FormBuilder/ImageFieldPreview";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Eye } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFormStore } from "../form-builder/store/useFormStore";
import { toAlpha, toRoman } from "@/lib/utils";
import { VideoCallPanel } from "@/components/VideoCall/VideoCallPanel";
import { Video, VideoOff, Edit, FileText } from "lucide-react";
import { useVideoCall } from "@/hooks/useVideoCall";
import { cn } from "@/lib/utils";

export default function FormPreview() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const formId = searchParams.get("formId");
    const projectId = searchParams.get("projectId");
    const organisationId = searchParams.get("organisationId");
    const returnUrl = searchParams.get("returnUrl");

    // Build the back URL to form-builder with params
    const getBackUrl = () => {
        const params = new URLSearchParams();
        if (formId) params.set("formId", formId);
        if (organisationId) params.set("organisationId", organisationId);
        if (projectId) params.set("projectId", projectId);
        if (returnUrl) params.set("returnUrl", returnUrl);
        return `/form-builder${params.toString() ? `?${params.toString()}` : ""}`;
    };

    const getAssessmentBackUrl = () => {
        if (projectId) {
            return `/app/${projectId}/assessments`;
        }
        return getBackUrl();
    };

    const { toast } = useToast();
    const { title, description, fields, sections, settings } = useFormStore();
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [formValues, setFormValues] = useState<Record<string, any>>({});

    // Video Call Hook
    const {
        localStream,
        participants,
        isConnected,
        isCallActive,
        isMuted,
        isVideoOff,
        error,
        joinCall,
        leaveCall,
        toggleMute,
        toggleVideo,
    } = useVideoCall({ roomId: formId || "default-room" });

    const currentSection = sections[currentSectionIndex];
    const currentFields = fields.filter(f => f.section === currentSection.id);

    const isFirstPage = currentSectionIndex === 0;
    const isLastPage = currentSectionIndex === sections.length - 1;

    const handleNext = () => {
        if (!isLastPage) {
            setCurrentSectionIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (!isFirstPage) {
            setCurrentSectionIndex(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = () => {
        console.log("Form Submitted:", formValues);
        toast({
            title: "Success",
            description: "Form submitted successfully (check console for data).",
        });
        setTimeout(() => router.push(getBackUrl()), 2000);
    };

    const handleValueChange = (fieldId: string, value: any) => {
        setFormValues(prev => ({ ...prev, [fieldId]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Preview Header - Always Visible */}
            <div className="bg-white border-b sticky top-0 z-10 px-4 py-3 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="pl-0 hover:bg-transparent hover:text-primary_orange"
                        onClick={() => router.push(getAssessmentBackUrl())}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                        <Eye className="h-4 w-4" />
                        <span>Preview Mode</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Video Call Button */}
                    <Button
                        variant={isCallActive ? "destructive" : "outline"}
                        size="icon"
                        onClick={isCallActive ? leaveCall : joinCall}
                        title={isCallActive ? "End Video Call" : "Start Video Call"}
                        className={isCallActive ? "animate-pulse" : ""}
                    >
                        {isCallActive ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(getBackUrl())}
                        title="Edit Form"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)] gap-8 items-start relative">
                    {/* Sidebar Navigation - Hidden on mobile */}
                    <div className="sticky top-24 hidden md:block">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="flex flex-col flex-1">
                                {sections.map((section, index) => (
                                    <div
                                        key={section.id}
                                        className={cn(
                                            "group flex items-center p-3 text-left transition-colors border-l-4 cursor-pointer hover:bg-gray-50",
                                            currentSectionIndex === index
                                                ? "bg-amber-50 border-[#FFD539]"
                                                : "bg-white border-transparent"
                                        )}
                                        onClick={() => {
                                            setCurrentSectionIndex(index);
                                            window.scrollTo(0, 0);
                                        }}
                                    >
                                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                            <div className={cn(
                                                "p-1.5 rounded-md",
                                                currentSectionIndex === index ? "text-amber-600" : "text-gray-400"
                                            )}>
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <span className={cn(
                                                "font-medium text-sm truncate",
                                                currentSectionIndex === index ? "text-gray-900" : "text-gray-600"
                                            )}>
                                                {section.title}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">

                        {/* Form Header - Only on First Page */}
                        {isFirstPage && (
                            <Card className="border-t-8 border-t-[#FFD539]">
                                <CardHeader>
                                    <CardTitle className="text-3xl font-normal">{title}</CardTitle>
                                    {description && <CardDescription className="text-lg mt-2">{description}</CardDescription>}
                                </CardHeader>
                            </Card>
                        )}

                        {/* Section Title (if pages > 1 and not first page, or if it has a custom title) */}
                        {(!isFirstPage || sections.length > 1) && (
                            <Card className="bg-white border-l-4 border-l-[#FFD539]">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-xl">{currentSection.title}</CardTitle>
                                </CardHeader>
                            </Card>
                        )}

                        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                            {currentFields.map((field, index) => {
                                // Calculate numbering per page
                                const questionIndex = currentFields
                                    .slice(0, index + 1)
                                    .filter(f => f.type !== 'section')
                                    .length;
                                const showNumber = field.type !== 'section';

                                return (
                                    <Card key={field.id}>
                                        <CardContent className="p-6">
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <div className="flex gap-2">
                                                        {showNumber && settings.numberingEnabled && (
                                                            <span className="text-base font-medium">
                                                                {settings.numberingSystem === 'numeric' ? `${questionIndex}.` :
                                                                    settings.numberingSystem === 'alpha' ? `${toAlpha(questionIndex - 1)}.` :
                                                                        `${toRoman(questionIndex)}.`}
                                                            </span>
                                                        )}
                                                        <Label className="text-base font-medium">
                                                            {field.label}
                                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                                        </Label>
                                                    </div>
                                                </div>

                                                {/* Field Rendering Logic */}
                                                {(() => {
                                                    switch (field.type) {
                                                        case 'text':
                                                        case 'date':
                                                        case 'time':
                                                        case 'file':
                                                            return (
                                                                <Input
                                                                    type="file"
                                                                    placeholder={field.placeholder}
                                                                    required={field.required}
                                                                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                                                                />
                                                            );
                                                        case 'image':
                                                            return <ImageFieldPreview />;
                                                        case 'textarea':
                                                            return (
                                                                <Textarea
                                                                    placeholder={field.placeholder}
                                                                    required={field.required}
                                                                    className="min-h-[100px]"
                                                                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                                                                />
                                                            );
                                                        case 'dropdown':
                                                            return (
                                                                <Select onValueChange={(val) => handleValueChange(field.id, val)}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select an option" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {field.options?.map((opt, idx) => (
                                                                            <SelectItem key={idx} value={opt || `option-${idx}`}>
                                                                                {opt}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            );
                                                        case 'radio':
                                                            return (
                                                                <RadioGroup onValueChange={(val) => handleValueChange(field.id, val)}>
                                                                    {field.options?.map((opt, idx) => (
                                                                        <div key={idx} className="flex items-center space-x-2">
                                                                            <RadioGroupItem value={opt || `option-${idx}`} id={`${field.id}-${idx}`} />
                                                                            <Label htmlFor={`${field.id}-${idx}`}>{opt}</Label>
                                                                        </div>
                                                                    ))}
                                                                </RadioGroup>
                                                            );
                                                        case 'checkbox':
                                                            return (
                                                                <div className="space-y-2">
                                                                    {field.options?.map((opt, idx) => (
                                                                        <div key={idx} className="flex items-center space-x-2">
                                                                            <Checkbox id={`${field.id}-${idx}`} />
                                                                            <Label htmlFor={`${field.id}-${idx}`}>{opt}</Label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        case 'section':
                                                            return (
                                                                <div className="py-2">
                                                                    {/* This is a "Title/Description" field type, not a page break */}
                                                                    <h3 className="text-lg font-medium">{field.label}</h3>
                                                                    {field.placeholder && <p className="text-sm text-gray-500">{field.placeholder}</p>}
                                                                </div>
                                                            );
                                                        case 'signature':
                                                            const sigValue = formValues[field.id] || {};
                                                            return (
                                                                <div className="mt-4 space-y-4 border rounded-lg p-4 bg-gray-50/50">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
                                                                            <Input
                                                                                placeholder="Signer's Name"
                                                                                className="bg-white"
                                                                                value={sigValue.name || ''}
                                                                                onChange={(e) => handleValueChange(field.id, { ...sigValue, name: e.target.value })}
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date</Label>
                                                                            <Input
                                                                                type="date"
                                                                                className="bg-white"
                                                                                value={sigValue.date || ''}
                                                                                onChange={(e) => handleValueChange(field.id, { ...sigValue, date: e.target.value })}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Signature</Label>
                                                                        <SignaturePad
                                                                            defaultValue={sigValue.signature}
                                                                            onChange={(val) => handleValueChange(field.id, { ...sigValue, signature: val })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        case 'inspection_checklist':
                                                            return (
                                                                <ChecklistRenderer
                                                                    config={field.checklistConfig}
                                                                    value={formValues[field.id]}
                                                                    onChange={(val) => handleValueChange(field.id, val)}
                                                                />
                                                            );
                                                        default:
                                                            return null;
                                                    }
                                                })()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </form>

                        <div className="flex justify-between items-center py-6">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={isFirstPage}
                                className={isFirstPage ? "invisible" : ""}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>

                            {isLastPage ? (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => router.push(getBackUrl())}>
                                        Edit
                                    </Button>
                                    <Button onClick={handleSubmit} className="bg-[#FFD539] text-black hover:bg-[#ffe066]">
                                        Submit <Check className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={handleNext}>
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Call Panel */}
            <VideoCallPanel
                isCallActive={isCallActive}
                isConnected={isConnected}
                localStream={localStream}
                participants={participants}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                error={error}
                onLeave={leaveCall}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                formId={formId}
                projectId={projectId}
            />
        </div>
    );
}
