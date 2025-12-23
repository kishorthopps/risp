"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:5001";

// STUN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

interface Participant {
    peerId: string;
    stream: MediaStream | null;
    connection: RTCPeerConnection;
    pendingCandidates: RTCIceCandidateInit[];
}

interface UseVideoCallOptions {
    roomId: string;
    enabled?: boolean;
}

interface UseVideoCallReturn {
    localStream: MediaStream | null;
    participants: Map<string, Participant>;
    isConnected: boolean;
    isCallActive: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    error: string | null;
    joinCall: () => Promise<void>;
    leaveCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
}

export function useVideoCall({ roomId, enabled = true }: UseVideoCallOptions): UseVideoCallReturn {
    const socketRef = useRef<Socket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const participantsRef = useRef<Map<string, Participant>>(new Map());

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
    const [isConnected, setIsConnected] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update participants state from ref
    const updateParticipants = useCallback(() => {
        setParticipants(new Map(participantsRef.current));
    }, []);

    // Create peer connection for a participant
    const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
        console.log(`[WebRTC] Creating peer connection for ${peerId}`);

        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks to connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit("ice-candidate", {
                    to: peerId,
                    candidate: event.candidate.toJSON(),
                });
            }
        };

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log(`[WebRTC] Received track from ${peerId}`);
            const participant = participantsRef.current.get(peerId);
            if (participant) {
                participant.stream = event.streams[0];
                updateParticipants();
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state for ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
                // Handle reconnection or cleanup
            }
        };

        return pc;
    }, [updateParticipants]);

    // Helper to flush pending ICE candidates
    const flushPendingCandidates = useCallback(async (participant: Participant) => {
        const { connection, pendingCandidates, peerId } = participant;
        if (pendingCandidates.length > 0 && connection.remoteDescription) {
            console.log(`[WebRTC] Flushing ${pendingCandidates.length} pending ICE candidates for ${peerId}`);
            for (const candidate of pendingCandidates) {
                try {
                    await connection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("[WebRTC] Error adding queued ICE candidate:", err);
                }
            }
            participant.pendingCandidates = [];
        }
    }, []);

    // Handle incoming offer
    const handleOffer = useCallback(async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
        console.log(`[WebRTC] Received offer from ${from}`);

        let participant = participantsRef.current.get(from);
        if (!participant) {
            participant = {
                peerId: from,
                stream: null,
                connection: createPeerConnection(from),
                pendingCandidates: [],
            };
            participantsRef.current.set(from, participant);
            updateParticipants();
        }

        const pc = participant.connection;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Flush any pending ICE candidates that arrived before the offer
        await flushPendingCandidates(participant);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit("answer", {
            to: from,
            answer: answer,
        });
    }, [createPeerConnection, updateParticipants, flushPendingCandidates]);

    // Handle incoming answer
    const handleAnswer = useCallback(async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
        console.log(`[WebRTC] Received answer from ${from}`);

        const participant = participantsRef.current.get(from);
        if (participant) {
            await participant.connection.setRemoteDescription(new RTCSessionDescription(answer));
            // Flush any pending ICE candidates that arrived before the answer
            await flushPendingCandidates(participant);
        }
    }, [flushPendingCandidates]);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
        if (!candidate) return;

        const participant = participantsRef.current.get(from);
        if (!participant) {
            console.log(`[WebRTC] Received ICE candidate from unknown peer ${from}, ignoring`);
            return;
        }

        // If remote description is not set yet, queue the candidate
        if (!participant.connection.remoteDescription) {
            console.log(`[WebRTC] Queuing ICE candidate from ${from} (no remote description yet)`);
            participant.pendingCandidates.push(candidate);
            return;
        }

        try {
            await participant.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error("[WebRTC] Error adding ICE candidate:", err);
        }
    }, []);

    // Handle new user joining
    const handleUserJoined = useCallback(async (peerId: string) => {
        console.log(`[WebRTC] User joined: ${peerId}`);

        const pc = createPeerConnection(peerId);
        participantsRef.current.set(peerId, {
            peerId,
            stream: null,
            connection: pc,
            pendingCandidates: [],
        });
        updateParticipants();

        // Create and send offer to new user
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketRef.current?.emit("offer", {
            to: peerId,
            offer: offer,
        });
    }, [createPeerConnection, updateParticipants]);

    // Handle user leaving
    const handleUserLeft = useCallback((peerId: string) => {
        console.log(`[WebRTC] User left: ${peerId}`);

        const participant = participantsRef.current.get(peerId);
        if (participant) {
            participant.connection.close();
            participantsRef.current.delete(peerId);
            updateParticipants();
        }
    }, [updateParticipants]);

    // Handle existing participants when joining
    // NOTE: We do NOT send offers here - the existing participants will send offers to us
    // via their handleUserJoined handler. This prevents the "glare" problem where both
    // sides try to initiate at the same time.
    const handleExistingParticipants = useCallback((peerIds: string[]) => {
        console.log(`[WebRTC] Existing participants: ${peerIds.length} - waiting for their offers`);

        // Just log for now - peer connections will be created when we receive offers
        // from the existing participants
    }, []);

    // Join the video call
    const joinCall = useCallback(async () => {
        if (!enabled || isCallActive) return;

        try {
            setError(null);

            // Get local media
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStreamRef.current = stream;
            setLocalStream(stream);

            // Connect to signaling server
            const socket = io(SIGNALING_SERVER, {
                transports: ["websocket"],
            });
            socketRef.current = socket;

            socket.on("connect", () => {
                console.log("[Socket] Connected to signaling server");
                setIsConnected(true);
                socket.emit("join-room", roomId);
            });

            socket.on("disconnect", () => {
                console.log("[Socket] Disconnected from signaling server");
                setIsConnected(false);
            });

            socket.on("existing-participants", handleExistingParticipants);
            socket.on("user-joined", handleUserJoined);
            socket.on("user-left", handleUserLeft);
            socket.on("offer", handleOffer);
            socket.on("answer", handleAnswer);
            socket.on("ice-candidate", handleIceCandidate);

            setIsCallActive(true);
        } catch (err) {
            console.error("[VideoCall] Error joining call:", err);
            setError(err instanceof Error ? err.message : "Failed to join call");
        }
    }, [enabled, isCallActive, roomId, handleExistingParticipants, handleUserJoined, handleUserLeft, handleOffer, handleAnswer, handleIceCandidate]);

    // Leave the video call
    const leaveCall = useCallback(() => {
        // Close all peer connections
        participantsRef.current.forEach((participant) => {
            participant.connection.close();
        });
        participantsRef.current.clear();
        updateParticipants();

        // Stop local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        // Leave room and disconnect socket
        if (socketRef.current) {
            socketRef.current.emit("leave-room", roomId);
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        setIsCallActive(false);
        setIsConnected(false);
        setIsMuted(false);
        setIsVideoOff(false);
    }, [roomId, updateParticipants]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isCallActive) {
                leaveCall();
            }
        };
    }, [isCallActive, leaveCall]);

    return {
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
    };
}
