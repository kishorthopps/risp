import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormStatus } from "@/types/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormHeaderProps {
    title: string;
    description: string;
    status: FormStatus;
    onUpdate: (data: { title?: string; description?: string; status?: FormStatus }) => void;
}

export function FormHeader({ title, description, status, onUpdate }: FormHeaderProps) {
    return (
        <Card className="mb-4 border-t-[10px] border-t-primary border-x border-b">
            <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-4">
                        <Input
                            value={title}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            placeholder="Form Title"
                            className="text-3xl font-medium border-0 border-b border-transparent focus-visible:ring-0 focus-visible:border-primary px-0 rounded-none h-auto pb-2 placeholder:text-gray-400"
                        />
                        <Textarea
                            value={description}
                            onChange={(e) => onUpdate({ description: e.target.value })}
                            placeholder="Form Description"
                            className="resize-none border-0 border-b border-transparent focus-visible:ring-0 focus-visible:border-gray-300 px-0 rounded-none min-h-[auto] placeholder:text-gray-400 text-sm"
                            rows={1}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                        />
                    </div>
                    <div className="w-[140px]">
                        <Select
                            value={status}
                            onValueChange={(value) => onUpdate({ status: value as FormStatus })}
                        >
                            <SelectTrigger className={status === 'COMPLETED' ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 text-gray-600"}>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
