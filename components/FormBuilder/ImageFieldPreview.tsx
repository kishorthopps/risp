"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageFieldPreviewProps {
    readOnly?: boolean;
}

export function ImageFieldPreview({ readOnly }: ImageFieldPreviewProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const triggerClick = () => {
        if (!readOnly) {
            inputRef.current?.click();
        }
    };

    if (preview) {
        return (
            <div className="relative mt-2 rounded-lg border overflow-hidden bg-gray-50 group">
                <img src={preview} alt="Preview" className="w-full h-48 object-contain bg-black/5" />
                {!readOnly && (
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleClear}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div
            onClick={triggerClick}
            className={cn(
                "mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-colors bg-white",
                !readOnly ? "cursor-pointer hover:bg-gray-50 hover:border-blue-400" : "opacity-60 cursor-not-allowed"
            )}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={readOnly}
            />
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                <p className="text-xs text-gray-400">SVG, PNG, JPG or GIF</p>
            </div>
        </div>
    );
}
