"use client";

import React, { useState } from 'react';
import { ChecklistAttachment, ChecklistConfig, checklistPayload, ChecklistCellData } from '@/types/form';
import { cn, toAlpha, toRoman } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Paperclip, ChevronDown, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { useFormStore } from '@/app/form-builder/store/useFormStore';

interface ChecklistRendererProps {
    config?: ChecklistConfig;
    value?: Record<string, Record<string, ChecklistCellData>>; // rowId -> columnId -> data
    onChange?: (value: Record<string, Record<string, ChecklistCellData>>) => void;
    readOnly?: boolean;
}


interface ChecklistCellProps {
    row: import('@/types/form').ChecklistRow;
    col: import('@/types/form').ChecklistColumn;
    cellData: ChecklistCellData;
    onValueChange: (inputId: string, value: any) => void;
    onCommentChange: (comment: string) => void;
    onAttachmentChange: (attachments: ChecklistAttachment[]) => void;
    readOnly: boolean;
}

const ChecklistCell: React.FC<ChecklistCellProps> = ({ row, col, cellData, onValueChange, onCommentChange, onAttachmentChange, readOnly }) => {
    const [showComment, setShowComment] = useState(!!cellData.comment);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (inputId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onValueChange(inputId, e.target.files[0].name);
        }
    };

    const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles: ChecklistAttachment[] = Array.from(e.target.files).map(f => ({
                name: f.name,
                url: URL.createObjectURL(f),
                file: f
            }));
            const currentAttachments = cellData.attachments || [];
            onAttachmentChange([...currentAttachments, ...newFiles]);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (indexToRemove: number) => {
        const currentAttachments = cellData.attachments || [];
        // Optional: Revoke URL if removing
        // URL.revokeObjectURL(currentAttachments[indexToRemove].url); 
        onAttachmentChange(currentAttachments.filter((_, idx) => idx !== indexToRemove));
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-2">
                {col.inputs.map(input => {
                    const val = cellData.values[input.id];

                    return (
                        <div key={input.id} className="flex items-center gap-2">
                            {input.type === 'checkbox' && (
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={val === true}
                                        onCheckedChange={(checked) => onValueChange(input.id, checked)}
                                        disabled={readOnly}
                                        id={`${row.id}-${col.id}-${input.id}`}
                                    />
                                    {input.label && <label htmlFor={`${row.id}-${col.id}-${input.id}`} className="text-sm text-gray-700 cursor-pointer">{input.label}</label>}
                                </div>
                            )}

                            {input.type === 'text' && (
                                <Input
                                    value={val || ''}
                                    onChange={(e) => onValueChange(input.id, e.target.value)}
                                    placeholder={input.label}
                                    disabled={readOnly}
                                    className="h-8 text-sm"
                                />
                            )}
                            {input.type === 'number' && (
                                <Input
                                    type="number"
                                    value={val || ''}
                                    onChange={(e) => onValueChange(input.id, e.target.value)}
                                    placeholder={input.label}
                                    disabled={readOnly}
                                    className="h-8 text-sm"
                                />
                            )}

                            {input.type === 'datetime' && (
                                <Input
                                    type="datetime-local"
                                    value={val || ''}
                                    onChange={(e) => onValueChange(input.id, e.target.value)}
                                    disabled={readOnly}
                                    className="h-8 text-sm w-full"
                                />
                            )}

                            {input.type === 'select' && (
                                <Select value={val} onValueChange={(v) => onValueChange(input.id, v)} disabled={readOnly}>
                                    <SelectTrigger className="h-8 text-sm w-full">
                                        <SelectValue placeholder={input.label || "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {input.options?.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {input.type === 'file' && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        onChange={(e) => handleFileChange(input.id, e)}
                                        disabled={readOnly}
                                        className="h-8 text-sm w-full cursor-pointer text-xs file:mr-2 file:py-0 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                    />
                                    {val && <span className="text-xs text-gray-500 truncate max-w-[100px]" title={val}>{val}</span>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Capabilities: Comments & Attachments */}
            {(col.capabilities.allowComments || col.capabilities.allowAttachments) && (
                <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1 justify-end opacity-50 hover:opacity-100 transition-opacity">
                        {col.capabilities.allowComments && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowComment(!showComment)} title="Add Comment">
                                <MessageSquare className={cn("h-3 w-3", cellData.comment ? "text-blue-500 fill-blue-500" : "text-gray-400")} />
                            </Button>
                        )}
                        {col.capabilities.allowAttachments && (
                            <>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleAttachmentUpload}
                                    disabled={readOnly}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    title="Add Attachments"
                                    disabled={readOnly}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip className={cn("h-3 w-3", (cellData.attachments?.length || 0) > 0 ? "text-blue-500" : "text-gray-400")} />
                                </Button>
                            </>
                        )}
                    </div>
                    {showComment && col.capabilities.allowComments && (
                        <Textarea
                            value={cellData.comment || ''}
                            onChange={(e) => onCommentChange(e.target.value)}
                            placeholder="Add comment..."
                            className="min-h-[60px] text-xs resize-y"
                            disabled={readOnly}
                        />
                    )}

                    {/* Attachments List */}
                    {col.capabilities.allowAttachments && cellData.attachments && cellData.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {cellData.attachments.map((attachment, idx) => (
                                <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-[10px] px-1 py-0 h-5 flex items-center gap-1 max-w-full cursor-pointer hover:bg-gray-200"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                >
                                    <span className="truncate max-w-[120px]">{attachment.name}</span>
                                    {!readOnly && (
                                        <div
                                            role="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeAttachment(idx);
                                            }}
                                            className="hover:text-red-500"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </div>
                                    )}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ChecklistRenderer: React.FC<ChecklistRendererProps> = ({ config, value = {}, onChange, readOnly = false }) => {
    // If no config, render nothing or placeholder
    if (!config || !config.columns || config.columns.length === 0) {
        return <div className="p-4 text-center text-gray-400 border rounded-md bg-gray-50 italic">Checklist not configured</div>;
    }

    const { settings } = useFormStore();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
        config.sections.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
    );

    const toggleSection = (secId: string) => {
        setExpandedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
    };

    const handleCellChange = (rowId: string, colId: string, inputId: string, val: any) => {
        if (readOnly || !onChange) return;

        const currentRowData = value[rowId] || {};
        const currentCellData = currentRowData[colId] || { values: {} };

        const newCellData = {
            ...currentCellData,
            values: { ...currentCellData.values, [inputId]: val }
        };

        onChange({
            ...value,
            [rowId]: { ...currentRowData, [colId]: newCellData }
        });
    };

    const handleCommentChange = (rowId: string, colId: string, comment: string) => {
        if (readOnly || !onChange) return;
        const currentRowData = value[rowId] || {};
        const currentCellData = currentRowData[colId] || { values: {} };
        const newCellData = { ...currentCellData, comment };
        onChange({ ...value, [rowId]: { ...currentRowData, [colId]: newCellData } });
    }

    const handleAttachmentChange = (rowId: string, colId: string, attachments: ChecklistAttachment[]) => {
        if (readOnly || !onChange) return;
        const currentRowData = value[rowId] || {};
        const currentCellData = currentRowData[colId] || { values: {} };
        const newCellData = { ...currentCellData, attachments };
        onChange({ ...value, [rowId]: { ...currentRowData, [colId]: newCellData } });
    }

    return (
        <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-100">
                        <TableRow>
                            <TableHead className="w-[300px] min-w-[200px]">Item</TableHead>
                            {config.columns.map(col => (
                                <TableHead key={col.id} className="min-w-[200px] text-center border-l">
                                    {col.name}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {config.sections.map((section, index) => {
                            const sectionRows = config.rows.filter(r => r.sectionId === section.id);

                            return (
                                <React.Fragment key={section.id}>
                                    {/* Section Header */}
                                    <TableRow className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleSection(section.id)}>
                                        <TableCell colSpan={config.columns.length + 1} className="font-semibold py-2">
                                            <div className="flex items-center gap-2">
                                                {expandedSections[section.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                <span className="font-bold">
                                                    {settings.gridSectionNumberingEnabled ? (
                                                        settings.gridSectionNumberingSystem === 'numeric' ? `${index + 1}.` :
                                                            settings.gridSectionNumberingSystem === 'alpha' ? `${toAlpha(index)}.` :
                                                                `${toRoman(index + 1)}.`
                                                    ) : ''}
                                                </span>
                                                <span>{section.title}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                    {/* Rows */}
                                    {expandedSections[section.id] && sectionRows.map((row, rowIndex) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium align-top py-4">
                                                <div className="flex gap-2">
                                                    <span className="text-gray-500 min-w-[30px] text-right font-mono flex-shrink-0">
                                                        {settings.gridItemNumberingEnabled ? (
                                                            settings.gridItemNumberingSystem === 'numeric' ? `${rowIndex + 1}.` :
                                                                settings.gridItemNumberingSystem === 'alpha' ? `${toAlpha(rowIndex)}.` :
                                                                    `${toRoman(rowIndex + 1)}.`
                                                        ) : ''}
                                                    </span>
                                                    <span>{row.text}</span>
                                                </div>
                                            </TableCell>
                                            {config.columns.map(col => {

                                                // Handle 'Info' (Static) Columns
                                                if (col.type === 'info') {
                                                    return (
                                                        <TableCell key={col.id} className="border-l align-top py-4 bg-gray-50/50">
                                                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                                                {row.info?.[col.id] || ''}
                                                            </div>
                                                        </TableCell>
                                                    );
                                                }
                                                const cellData = value[row.id]?.[col.id] || { values: {} };

                                                return (
                                                    <TableCell key={col.id} className={cn("border-l border-gray-100 align-top py-2 px-2")}>
                                                        <ChecklistCell
                                                            row={row}
                                                            col={col}
                                                            cellData={cellData}
                                                            onValueChange={(inputId, val) => handleCellChange(row.id, col.id, inputId, val)}
                                                            onCommentChange={(comment) => handleCommentChange(row.id, col.id, comment)}
                                                            onAttachmentChange={(attachments) => handleAttachmentChange(row.id, col.id, attachments)}
                                                            readOnly={readOnly}
                                                        />
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
