import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
    onChange?: (dataUrl: string | null) => void;
    readOnly?: boolean;
    defaultValue?: string;
}

export function SignaturePad({ onChange, readOnly = false, defaultValue }: SignaturePadProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(!defaultValue);

    const clear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
        onChange?.(null);
    };

    const handleEnd = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            setIsEmpty(false);
            onChange?.(sigCanvas.current.toDataURL());
        }
    };

    return (
        <div className="border border-gray-300 rounded-md overflow-hidden bg-white w-full">
            <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                    className: 'w-full h-40 bg-white cursor-crosshair',
                }}
                onEnd={handleEnd}
                clearOnResize={false}
            />
            {!readOnly && (
                <div className="bg-gray-50 p-2 flex justify-end border-t">
                    <Button variant="ghost" size="sm" onClick={clear} type="button" className="text-xs h-8">
                        <Eraser className="w-3 h-3 mr-1" />
                        Clear
                    </Button>
                </div>
            )}
        </div>
    );
}
