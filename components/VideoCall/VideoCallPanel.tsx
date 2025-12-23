"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    PhoneOff,
    Maximize2,
    Minimize2,
    X,
    Users,
    Circle,
    Square,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { mcApiService } from "@/lib/mcApiService";
import { useQueryClient } from "@tanstack/react-query";

// Participant interface matching the hook
interface Participant {
    peerId: string;
    stream: MediaStream | null;
}

interface VideoCallPanelProps {
    className?: string;
    isCallActive: boolean;
    isConnected: boolean;
    localStream: MediaStream | null;
    participants: Map<string, Participant>;
    isMuted: boolean;
    isVideoOff: boolean;
    error: string | null;
    onLeave: () => void;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    formId?: string | null;
    projectId?: string | null;
}

function VideoTile({
    stream,
    label,
    isLocal = false,
    isMuted = false,
    isVideoOff = false,
    id
}: {
    stream: MediaStream | null;
    label: string;
    isLocal?: boolean;
    isMuted?: boolean;
    isVideoOff?: boolean;
    id?: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            {stream && !isVideoOff ? (
                <video
                    id={id}
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal} // Local is muted in UI to prevent echo, but we need it for recording (handled separately)
                    className={cn(
                        "w-full h-full object-cover",
                        isLocal && "scale-x-[-1]" // Mirror local video
                    )}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center">
                        <span className="text-2xl text-white font-medium">
                            {label.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                    {label}
                </span>
                <div className="flex gap-1">
                    {isMuted && (
                        <span className="bg-red-500 p-1 rounded">
                            <MicOff className="h-3 w-3 text-white" />
                        </span>
                    )}
                    {isVideoOff && (
                        <span className="bg-red-500 p-1 rounded">
                            <VideoOff className="h-3 w-3 text-white" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function VideoCallPanel({
    className,
    isCallActive,
    isConnected,
    localStream,
    participants,
    isMuted,
    isVideoOff,
    error,
    onLeave,
    onToggleMute,
    onToggleVideo,
    formId,
    projectId
}: VideoCallPanelProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const queryClient = useQueryClient();

    // Recording refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

    const participantCount = participants.size + (isCallActive ? 1 : 0);

    // Clean up recording on unmount or call end
    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, []);

    const startRecording = async () => {
        try {
            console.log("Starting recording setup...");

            // 1. Setup Canvas
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            canvasRef.current = canvas;
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error("Failed to get canvas context");

            // 2. Setup Audio Mixing
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const dest = audioContext.createMediaStreamDestination();
            streamDestRef.current = dest;

            // Add local audio
            if (localStream && localStream.getAudioTracks().length > 0) {
                const source = audioContext.createMediaStreamSource(localStream);
                source.connect(dest);
            }

            // Add remote audio
            participants.forEach((p) => {
                if (p.stream && p.stream.getAudioTracks().length > 0) {
                    const source = audioContext.createMediaStreamSource(p.stream);
                    source.connect(dest);
                }
            });

            // 3. Setup Video Drawing Loop
            const drawFrame = () => {
                if (!ctx || !canvas) return;

                // Fill background
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const activeVideos: HTMLVideoElement[] = [];

                // Collect active video elements
                const localVideo = document.getElementById('video-local') as HTMLVideoElement;
                if (localVideo && !localVideo.paused && !localVideo.ended) activeVideos.push(localVideo);

                participants.forEach((p) => {
                    const remoteVideo = document.getElementById(`video-${p.peerId}`) as HTMLVideoElement;
                    if (remoteVideo && !remoteVideo.paused && !remoteVideo.ended) activeVideos.push(remoteVideo);
                });

                const count = activeVideos.length;

                if (count > 0) {
                    // Calculate grid
                    const cols = Math.ceil(Math.sqrt(count));
                    const rows = Math.ceil(count / cols);
                    const width = canvas.width / cols;
                    const height = canvas.height / rows;

                    activeVideos.forEach((video, index) => {
                        const col = index % cols;
                        const row = Math.floor(index / cols);
                        const x = col * width;
                        const y = row * height;

                        // Draw video while maintaining aspect ratio (cover)
                        const hRatio = width / video.videoWidth;
                        const vRatio = height / video.videoHeight;
                        const ratio = Math.max(hRatio, vRatio);
                        const centerShift_x = (width - video.videoWidth * ratio) / 2;
                        const centerShift_y = (height - video.videoHeight * ratio) / 2;

                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(x, y, width, height);
                        ctx.clip();
                        ctx.drawImage(
                            video,
                            0, 0, video.videoWidth, video.videoHeight,
                            x + centerShift_x, y + centerShift_y, video.videoWidth * ratio, video.videoHeight * ratio
                        );

                        // Add label background
                        ctx.fillStyle = 'rgba(0,0,0,0.5)';
                        ctx.fillRect(x + 10, y + height - 40, 200, 30);

                        // Add label text
                        ctx.fillStyle = 'white';
                        ctx.font = '20px Arial';
                        ctx.fillText(video.id === 'video-local' ? 'You' : `User ${video.id.replace('video-', '').slice(0, 4)}`, x + 20, y + height - 18);

                        ctx.restore();
                    });
                } else {
                    ctx.fillStyle = 'white';
                    ctx.font = '30px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Audio Only / Waiting for Video...', canvas.width / 2, canvas.height / 2);
                }

                animationFrameRef.current = requestAnimationFrame(drawFrame);
            };

            drawFrame();

            // 4. Create MediaRecorder
            const canvasStream = canvas.captureStream(30);
            // Combine mixed audio with canvas video
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]);

            const recorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9,opus'
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                recordedChunksRef.current = []; // Clear chunks immediately
                mediaRecorderRef.current = null;

                // Create FormData
                const formData = new FormData();
                const filename = `recording-${Date.now()}.webm`;
                formData.append("video", blob, filename);
                if (formId) formData.append("formId", formId);
                if (projectId) formData.append("projectId", projectId);
                formData.append("type", "VIDEOCALL");

                const toastId = toast.loading("Uploading recording...");

                try {
                    await mcApiService.post("/media/video/upload", formData);
                    toast.success("Recording uploaded successfully", { id: toastId });

                    if (formId) {
                        queryClient.invalidateQueries({ queryKey: ["media", "form", formId] });
                    }
                    if (projectId) {
                        queryClient.invalidateQueries({ queryKey: ["media", "project", projectId] });
                    }
                } catch (error) {
                    console.error("Upload failed", error);
                    toast.error("Failed to upload recording", { id: toastId });

                    // Fallback to download if upload fails
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            toast.success("Recording started");

        } catch (error) {
            console.error("Failed to start recording:", error);
            toast.error("Failed to start recording");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // toast.success("Processing recording..."); // Moved to onstop
        }

        // Cleanup
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();

        mediaRecorderRef.current = null;
        canvasRef.current = null;
        audioContextRef.current = null;
        streamDestRef.current = null;
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Only render if call is active
    if (!isCallActive) {
        return null;
    }

    // Minimized view
    if (isMinimized) {
        return (
            <div className={cn("fixed bottom-4 right-4 z-50", className)}>
                <Card className="shadow-xl border-2">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4" />
                            <span>{participantCount}</span>
                        </div>
                        <div className="flex gap-1">
                            {/* Minimized Controls */}
                            <Button
                                variant={isRecording ? "destructive" : "ghost"}
                                size="icon"
                                className={cn("h-8 w-8", isRecording && "animate-pulse")}
                                onClick={toggleRecording}
                                title={isRecording ? "Stop Recording" : "Record"}
                            >
                                {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Circle className="h-4 w-4 fill-current text-red-500" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={onToggleMute}
                            >
                                {isMuted ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                            </Button>
                            {/* ... other minimized buttons ... */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsMinimized(false)}
                            >
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={onLeave}
                            >
                                <PhoneOff className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Full panel view
    const panelClasses = isExpanded
        ? "fixed inset-4 z-50"
        : "fixed bottom-4 right-4 w-96 z-50";

    return (
        <div className={cn(panelClasses, className)}>
            <Card className="h-full shadow-xl border-2 flex flex-col">
                <CardHeader className="pb-2 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-green-500")} />
                            {isRecording ? "Recording..." : "Video Call"}
                            <span className="text-xs text-muted-foreground">
                                ({participantCount} {participantCount === 1 ? "participant" : "participants"})
                            </span>
                        </CardTitle>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                    if (formId) {
                                        const params = new URLSearchParams();
                                        params.set("formId", formId);
                                        if (projectId) params.set("projectId", projectId);
                                        window.open(`/video-call?${params.toString()}`, '_blank');
                                    }
                                }}
                                title="Open in new tab"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsMinimized(true)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    {error && (
                        <p className="text-xs text-red-500 mt-1">{error}</p>
                    )}
                    {!isConnected && (
                        <p className="text-xs text-yellow-500 mt-1">Connecting...</p>
                    )}
                </CardHeader>

                <CardContent className="flex-1 overflow-auto pb-20">
                    <div className={cn(
                        "grid gap-2",
                        participantCount <= 2 ? "grid-cols-1" :
                            participantCount <= 4 ? "grid-cols-2" : "grid-cols-3"
                    )}>
                        {/* Local video */}
                        <VideoTile
                            id="video-local"
                            stream={localStream}
                            label="You"
                            isLocal
                            isMuted={isMuted}
                            isVideoOff={isVideoOff}
                        />

                        {/* Remote participants */}
                        {Array.from(participants.values()).map((participant) => (
                            <VideoTile
                                key={participant.peerId}
                                id={`video-${participant.peerId}`}
                                stream={participant.stream}
                                label={`User ${participant.peerId.slice(0, 4)}`}
                            />
                        ))}
                    </div>
                </CardContent>

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex justify-center gap-3">
                        <Button
                            variant={isRecording ? "destructive" : "secondary"}
                            size="icon"
                            className={cn("rounded-full h-12 w-12", isRecording && "animate-pulse ring-2 ring-white")}
                            onClick={toggleRecording}
                            title={isRecording ? "Stop Recording" : "Start Recording"}
                        >
                            {isRecording ? <Square className="h-5 w-5 fill-current" /> : <Circle className="h-5 w-5 fill-current text-red-500" />}
                        </Button>
                        <Button
                            variant={isMuted ? "destructive" : "secondary"}
                            size="icon"
                            className="rounded-full h-12 w-12"
                            onClick={onToggleMute}
                        >
                            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                        <Button
                            variant={isVideoOff ? "destructive" : "secondary"}
                            size="icon"
                            className="rounded-full h-12 w-12"
                            onClick={onToggleVideo}
                        >
                            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="rounded-full h-12 w-12"
                            onClick={onLeave}
                        >
                            <PhoneOff className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
