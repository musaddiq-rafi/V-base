"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ArrowLeft,
  Settings,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

interface MeetingLobbyProps {
  roomName: string;
  meetingName: string;
  workspaceId: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onJoin: () => void;
  onBack: () => void;
}

export function MeetingLobby({
  roomName,
  meetingName,
  workspaceId,
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onJoin,
  onBack,
}: MeetingLobbyProps) {
  const { user } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Initialize camera preview
  useEffect(() => {
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationId: number;

    const initMedia = async () => {
      // Skip getUserMedia if both video and audio are disabled
      if (!isVideoEnabled && !isAudioEnabled) {
        setMediaStream(null);
        setHasPermission(true); // No permission needed if nothing is requested
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoEnabled,
          audio: isAudioEnabled,
        });
        setMediaStream(stream);
        setHasPermission(true);

        if (videoRef.current && isVideoEnabled) {
          videoRef.current.srcObject = stream;
        }

        // Set up audio level monitoring
        if (isAudioEnabled && stream.getAudioTracks().length > 0) {
          audioContext = new AudioContext();
          analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateAudioLevel = () => {
            if (analyser) {
              analyser.getByteFrequencyData(dataArray);
              const average =
                dataArray.reduce((a, b) => a + b) / dataArray.length;
              setAudioLevel(average / 128); // Normalize to 0-1
            }
            animationId = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (error) {
        console.error("Failed to get media:", error);
        setHasPermission(false);
      }
    };

    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isVideoEnabled, isAudioEnabled]);

  // Update video element when stream or video state changes
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      if (isVideoEnabled) {
        videoRef.current.srcObject = mediaStream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [isVideoEnabled, mediaStream]);

  return (
    <div className="min-h-screen bg-[#313338] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between h-12 px-4 border-b border-[#1e1f22] bg-[#2b2d31]"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#b5bac1] hover:text-[#f2f3f5] transition-colors text-[13px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-[#3f4147]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5865f2]/20 flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-[#5865f2]" />
            </div>
            <span className="font-semibold text-[#f2f3f5] text-[15px]">
              {roomName}
            </span>
          </div>
        </div>
        <button className="p-1.5 rounded-md hover:bg-[#3f4147] text-[#b5bac1] hover:text-[#f2f3f5] transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative aspect-video bg-[#1e1f22] rounded-xl overflow-hidden ring-1 ring-white/[0.06]"
          >
            {isVideoEnabled && hasPermission ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#2b2d31]">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-[#5865f2] flex items-center justify-center mx-auto mb-3">
                    {hasPermission === false ? (
                      <Video className="w-8 h-8 text-white" />
                    ) : (
                      <VideoOff className="w-8 h-8 text-white/60" />
                    )}
                  </div>
                  <p className="text-[#b5bac1] text-sm">
                    {hasPermission === false
                      ? "Camera permission denied"
                      : "Camera is off"}
                  </p>
                </div>
              </div>
            )}

            {/* Audio Level Indicator */}
            {isAudioEnabled && audioLevel > 0.1 && (
              <div className="absolute top-3 right-3 flex items-center gap-0.5">
                <div
                  className="w-1 bg-[#23a559] rounded-full transition-all"
                  style={{ height: `${8 + audioLevel * 16}px` }}
                />
                <div
                  className="w-1 bg-[#23a559] rounded-full transition-all"
                  style={{ height: `${12 + audioLevel * 20}px` }}
                />
                <div
                  className="w-1 bg-[#23a559] rounded-full transition-all"
                  style={{ height: `${8 + audioLevel * 16}px` }}
                />
              </div>
            )}

            {/* Preview Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#1e1f22]/80 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={onToggleAudio}
                className={`p-2.5 rounded-md transition-colors ${
                  isAudioEnabled
                    ? "hover:bg-[#3f4147] text-[#b5bac1] hover:text-[#f2f3f5]"
                    : "bg-[#ed4245] text-white"
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onToggleVideo}
                className={`p-2.5 rounded-md transition-colors ${
                  isVideoEnabled
                    ? "hover:bg-[#3f4147] text-[#b5bac1] hover:text-[#f2f3f5]"
                    : "bg-[#ed4245] text-white"
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* User Name Tag */}
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-1 bg-black/60 rounded-md text-white text-xs font-medium">
                {user?.fullName || user?.username || "You"}
              </span>
            </div>
          </motion.div>

          {/* Join Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <h1 className="text-2xl font-bold text-[#f2f3f5] mb-2">
              Ready to join?
            </h1>
            <p className="text-[#b5bac1] text-sm mb-6">
              Check your audio and video before joining.
            </p>

            {/* Meeting Info */}
            <div className="bg-[#2b2d31] rounded-lg p-4 mb-5 border border-[#1e1f22]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#5865f2]/20 flex items-center justify-center">
                  <Video className="w-4 h-4 text-[#5865f2]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#f2f3f5] text-[15px]">
                    {meetingName}
                  </h3>
                  <p className="text-xs text-[#b5bac1]">{roomName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#b5bac1]">
                <Users className="w-3.5 h-3.5" />
                <span>Joining meeting...</span>
              </div>
            </div>

            {/* Device Status */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between p-2.5 bg-[#2b2d31] rounded-md border border-[#1e1f22]">
                <div className="flex items-center gap-2.5">
                  {isAudioEnabled ? (
                    <Mic className="w-4 h-4 text-[#23a559]" />
                  ) : (
                    <MicOff className="w-4 h-4 text-[#ed4245]" />
                  )}
                  <span className="text-[13px] text-[#f2f3f5]">Microphone</span>
                </div>
                <span
                  className={`text-xs font-medium ${isAudioEnabled ? "text-[#23a559]" : "text-[#ed4245]"}`}
                >
                  {isAudioEnabled ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#2b2d31] rounded-md border border-[#1e1f22]">
                <div className="flex items-center gap-2.5">
                  {isVideoEnabled ? (
                    <Video className="w-4 h-4 text-[#23a559]" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-[#ed4245]" />
                  )}
                  <span className="text-[13px] text-[#f2f3f5]">Camera</span>
                </div>
                <span
                  className={`text-xs font-medium ${isVideoEnabled ? "text-[#23a559]" : "text-[#ed4245]"}`}
                >
                  {isVideoEnabled ? "On" : "Off"}
                </span>
              </div>
            </div>

            {/* Join Button */}
            <button
              onClick={onJoin}
              className="w-full py-3 bg-[#23a559] hover:bg-[#1a8245] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-[15px]"
            >
              <Video className="w-4 h-4" />
              Join Voice
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
