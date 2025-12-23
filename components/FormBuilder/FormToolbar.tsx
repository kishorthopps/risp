import { Plus, SplitSquareVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FieldType } from "@/types/form";

interface FormToolbarProps {
    onAddField: (type: FieldType) => void;
    onAddSection: () => void;
    embedded?: boolean;
}

export function FormToolbar({ onAddField, onAddSection, embedded }: FormToolbarProps) {
    const defaultClasses = "fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/95 backdrop-blur-sm border shadow-lg rounded-full px-6 py-2 z-50 md:static md:flex-col md:p-1.5 md:bg-white md:rounded-lg md:border md:shadow-sm md:sticky md:top-24 md:translate-x-0";
    const embeddedClasses = "absolute -right-16 top-0 flex flex-col gap-2 bg-white p-2 rounded-lg border shadow-sm z-10 hidden md:flex";

    return (
        <div className={embedded ? embeddedClasses : defaultClasses}>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddField('text');
                            }}
                        >
                            <Plus className="h-5 w-5 text-gray-600" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Add Question</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddSection();
                            }}
                        >
                            <SplitSquareVertical className="h-5 w-5 text-gray-600" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Add Section</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
