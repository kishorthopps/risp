import React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FormField } from "@/types/form";
import { FieldEditor } from "./FieldEditor";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Plus, SplitSquareVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormStore } from "@/app/form-builder/store/useFormStore";
import { toAlpha, toRoman } from "@/lib/utils";

interface FormCanvasProps {
    fields: FormField[];
    onReorder: (activeId: string, overId: string) => void;
    onUpdate: (id: string, updatedField: Partial<FormField>) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onAddBelow: (index: number) => void;
    activeFieldId: string | null;
    setActiveFieldId: (id: string | null) => void;
    onAddFirst: () => void;
    onAddField: (type: import("@/types/form").FieldType, index?: number) => void;
    onAddSection: (index?: number) => void;
}

export function FormCanvas({
    fields,
    onReorder,
    onUpdate,
    onDelete,
    onDuplicate,
    onAddBelow,
    activeFieldId,
    setActiveFieldId,
    onAddFirst,
    onAddField,
    onAddSection,
}: FormCanvasProps) {
    const { settings } = useFormStore();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorder(active.id as string, over.id as string);
        }
    };

    if (fields.length === 0) {
        return (
            <Card className="border-dashed border-2 mt-4">
                <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <ClipboardList className="h-16 w-16" />
                        <h2 className="text-2xl font-semibold">No Fields in this Section</h2>
                        <p>Click below to start adding fields.</p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onAddFirst}>
                                Add Field
                            </Button>
                            <Button variant="outline" onClick={() => onAddSection()}>
                                Add Section
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >

            <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {fields.map((field, index) => {
                        // Calculate index excluding visual-only fields (like section titles)
                        // Actually, user said "auto numbering for each page".
                        // Assuming we skip 'section' type (which is Title/Desc).
                        // Note: 'fields' prop passed here is alrady filtered by active section.

                        // We need to count how many fields BEFORE this one are question types.
                        const questionIndex = fields
                            .slice(0, index + 1)
                            .filter(f => f.type !== 'section')
                            .length;

                        const showNumber = field.type !== 'section';

                        return (
                            <FieldEditor
                                key={field.id}
                                field={field}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                onDuplicate={onDuplicate}
                                onAddBelow={() => onAddBelow(index + 1)}
                                isActive={field.id === activeFieldId}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveFieldId(field.id);
                                }}
                                index={showNumber && settings.numberingEnabled ? (
                                    settings.numberingSystem === 'numeric' ? questionIndex :
                                        settings.numberingSystem === 'alpha' ? toAlpha(questionIndex - 1) :
                                            toRoman(questionIndex)
                                ) : undefined} // Logic updated to pass formatted string or number, but FieldEditor expects number? Wait, FieldEditor props say index?: number. 
                                // I need to update FieldEditor to accept string or number for index.
                                // Actually, let's check FieldEditor first.
                                positionIndex={index}
                                onAddField={onAddField}
                                onAddSection={onAddSection}
                            />
                        );
                    })}
                </div>
            </SortableContext>
            <div className="flex gap-4 mt-6 justify-center">
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => onAddField('text')}
                >
                    <Plus className="h-4 w-4" />
                    Add Field
                </Button>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => onAddSection()}
                >
                    <SplitSquareVertical className="h-4 w-4" />
                    Add Section
                </Button>
            </div>
        </DndContext>
    );

}
