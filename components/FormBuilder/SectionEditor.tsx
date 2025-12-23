import React from "react";
import { FormField } from "@/types/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface SectionEditorProps {
    field: FormField;
    onUpdate: (id: string, updatedField: Partial<FormField>) => void;
    onDelete: (id: string) => void;
    isActive: boolean;
}

export function SectionEditor({ field, onUpdate, onDelete, isActive }: SectionEditorProps) {
    if (isActive) {
        return (
            <div className="flex items-center justify-between gap-4">
                <Input
                    value={field.label}
                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                    placeholder="Section Title"
                    className="text-2xl font-bold border-0 focus-visible:ring-0 px-0 placeholder:text-gray-400 h-auto"
                    autoFocus
                />
                <Button variant="ghost" size="icon" onClick={() => onDelete(field.id)} className="flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                </Button>
            </div>
        );
    }

    return (
        <div className="py-2">
            <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-transparent hover:border-b-2 hover:border-gray-100 transition-colors pb-1">
                {field.label || "Untitled Section"}
            </h2>
        </div>
    );
}
