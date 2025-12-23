import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface OptionsEditorProps {
  options: string[];
  onUpdate: (newOptions: string[]) => void;
}

export function OptionsEditor({ options, onUpdate }: OptionsEditorProps) {

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onUpdate(newOptions);
  };

  const handleAddOption = () => {
    onUpdate([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onUpdate(newOptions);
  };

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="placeholder-gray-500"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveOption(index)}
            disabled={options.length <= 1}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={handleAddOption} className="font-normal">
        Add Option
      </Button>
    </div>
  );
}
