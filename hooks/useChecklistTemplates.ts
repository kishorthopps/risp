"use client";

import { useState, useEffect } from 'react';
import { ChecklistColumn } from '@/types/form';

export interface ChecklistTemplate {
    id: string;
    name: string;
    columns: ChecklistColumn[];
    createdAt: number;
}

const STORAGE_KEY = 'risp_checklist_templates';

export function useChecklistTemplates() {
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setTemplates(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse checklist templates", e);
            }
        }
    }, []);

    const saveTemplate = (name: string, columns: ChecklistColumn[]) => {
        const newTemplate: ChecklistTemplate = {
            id: `tmpl-${Date.now()}`,
            name,
            columns,
            createdAt: Date.now()
        };

        const updated = [...templates, newTemplate];
        setTemplates(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newTemplate;
    };

    const deleteTemplate = (id: string) => {
        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return {
        templates,
        saveTemplate,
        deleteTemplate
    };
}
