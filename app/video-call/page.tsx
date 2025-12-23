"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useVideoCall } from "@/hooks/useVideoCall";
import { VideoCallPanel } from "@/components/VideoCall/VideoCallPanel";
import { Loader2 } from "lucide-react";

function VideoCallContent() {
    const searchParams = useSearchParams();
    const formId = searchParams.get("formId");
    const projectId = searchParams.get("projectId");

    const {
        localStream,
        participants,
        isConnected,
        isCallActive,
        isMuted,
        isVideoOff,
        error,
        joinCall,
        leaveCall,
        toggleMute,
        toggleVideo,
    } = useVideoCall({ roomId: formId || "default-room" });

    // Auto-join on mount
    useEffect(() => {
        if (formId && !isCallActive && !isConnected) {
            joinCall();
        }
    }, [formId, isCallActive, isConnected, joinCall]);

    if (!formId) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <p>Invalid Call Parameters</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-gray-950 overflow-hidden">
            <VideoCallPanel
                className="fixed inset-0 w-full h-full border-0 rounded-none z-0"
                isCallActive={true} // Force active UI so it renders
                isConnected={isConnected}
                localStream={localStream}
                participants={participants}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                error={error}
                onLeave={() => {
                    leaveCall();
                    window.close(); // Close tab on leave
                }}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                formId={formId}
                projectId={projectId}
            />
        </div>
    );
}

export default function VideoCallPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <VideoCallContent />
        </Suspense>
    );
}
