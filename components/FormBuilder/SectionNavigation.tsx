"use client";

import { Section } from "@/types/form";
import { cn } from "@/lib/utils";
import { FileText, Plus, MoreVertical, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";


import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface SectionNavigationProps {
    sections: Section[];
    activeSection: string;
    onSectionChange: (sectionId: string) => void;
    onAddSection: () => void;
    onUpdateSection: (id: string, updates: Partial<Section>) => void;
    onRemoveSection: (id: string) => void;
}

export function SectionNavigation({
    sections,
    activeSection,
    onSectionChange,
    onAddSection,
    onUpdateSection,
    onRemoveSection
}: SectionNavigationProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const startEditing = (section: Section) => {
        setEditingId(section.id);
        setEditTitle(section.title);
    };

    const saveEditing = () => {
        if (editingId) {
            onUpdateSection(editingId, { title: editTitle });
            setEditingId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveEditing();
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-w-[240px] flex flex-col">
            <div className="flex flex-col flex-1">
                {sections.map((section) => (
                    <div
                        key={section.id}
                        className={cn(
                            "group flex items-center justify-between p-3 text-left transition-colors border-l-4 cursor-pointer hover:bg-gray-50",
                            activeSection === section.id
                                ? "bg-amber-50 border-[#FFD539]"
                                : "bg-white border-transparent"
                        )}
                        onClick={() => onSectionChange(section.id)}
                    >
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                            <div className={cn(
                                "p-1.5 rounded-md",
                                activeSection === section.id ? "text-amber-600" : "text-gray-400"
                            )}>
                                <FileText className="h-4 w-4" />
                            </div>

                            {editingId === section.id ? (
                                <Input
                                    key={`rename-${section.id}`}
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={saveEditing}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-7 text-sm"
                                />
                            ) : (
                                <span className={cn(
                                    "font-medium text-sm truncate",
                                    activeSection === section.id ? "text-gray-900" : "text-gray-600"
                                )}>
                                    {section.title}
                                </span>
                            )}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(section);
                                }}>
                                    <Pencil className="mr-2 h-3 w-3" />
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveSection(section.id);
                                    }}
                                    disabled={sections.length <= 1}
                                >
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}
            </div>

            <div className="p-3 border-t bg-gray-50">
                <Button
                    variant="outline"
                    className="w-full gap-2 border-dashed bg-white"
                    onClick={onAddSection}
                >
                    <Plus className="h-4 w-4" />
                    Add Page
                </Button>
            </div>
        </div>
    );
}
