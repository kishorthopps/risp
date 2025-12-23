import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFormStore } from "@/app/form-builder/store/useFormStore";

interface FormSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FormSettingsDialog({ open, onOpenChange }: FormSettingsDialogProps) {
    const { settings, updateSettings } = useFormStore();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Form Settings</DialogTitle>
                    <DialogDescription>
                        Configure general settings for this form.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="numbering">Question Numbering</Label>
                            <div className="text-sm text-muted-foreground">
                                Enable automatic numbering for questions
                            </div>
                        </div>
                        <Switch
                            id="numbering"
                            checked={settings.numberingEnabled}
                            onCheckedChange={(checked) => updateSettings({ numberingEnabled: checked })}
                        />
                    </div>

                    {settings.numberingEnabled && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="system" className="text-right col-span-1">
                                System
                            </Label>
                            <Select
                                value={settings.numberingSystem}
                                onValueChange={(value: 'numeric' | 'alpha' | 'roman') =>
                                    updateSettings({ numberingSystem: value })
                                }
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select numbering system" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="numeric">Numeric (1, 2, 3...)</SelectItem>
                                    <SelectItem value="alpha">Alphabetic (A, B, C...)</SelectItem>
                                    <SelectItem value="roman">Roman (I, II, III...)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Grid Section Numbering */}
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="gridSectionNumbering">Grid Section Numbering</Label>
                            <div className="text-sm text-muted-foreground">
                                Numbering for grid grouping headers
                            </div>
                        </div>
                        <Switch
                            id="gridSectionNumbering"
                            checked={settings.gridSectionNumberingEnabled}
                            onCheckedChange={(checked) => updateSettings({ gridSectionNumberingEnabled: checked })}
                        />
                    </div>

                    {settings.gridSectionNumberingEnabled && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="gridSectionSystem" className="text-right col-span-1">
                                System
                            </Label>
                            <Select
                                value={settings.gridSectionNumberingSystem}
                                onValueChange={(value: 'numeric' | 'alpha' | 'roman') =>
                                    updateSettings({ gridSectionNumberingSystem: value })
                                }
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select section numbering" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="numeric">Numeric (1, 2, 3...)</SelectItem>
                                    <SelectItem value="alpha">Alphabetic (A, B, C...)</SelectItem>
                                    <SelectItem value="roman">Roman (I, II, III...)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Grid Item Numbering */}
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="gridItemNumbering">Grid Item Numbering</Label>
                            <div className="text-sm text-muted-foreground">
                                Numbering for individual grid rows
                            </div>
                        </div>
                        <Switch
                            id="gridItemNumbering"
                            checked={settings.gridItemNumberingEnabled}
                            onCheckedChange={(checked) => updateSettings({ gridItemNumberingEnabled: checked })}
                        />
                    </div>

                    {settings.gridItemNumberingEnabled && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="gridItemSystem" className="text-right col-span-1">
                                System
                            </Label>
                            <Select
                                value={settings.gridItemNumberingSystem}
                                onValueChange={(value: 'numeric' | 'alpha' | 'roman') =>
                                    updateSettings({ gridItemNumberingSystem: value })
                                }
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select item numbering" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="numeric">Numeric (1, 2, 3...)</SelectItem>
                                    <SelectItem value="alpha">Alphabetic (a, b, c...)</SelectItem>
                                    <SelectItem value="roman">Roman (i, ii, iii...)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
