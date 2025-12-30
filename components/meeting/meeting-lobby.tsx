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
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between h-16 px-6 border-b border-gray-800"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Video className="w-4 h-4 text-orange-500" />
            </div>
            <span className="font-semibold text-white">{roomName}</span>
          </div>
        </div>
        <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
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
            className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden"
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
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    {hasPermission === false ? (
                      <Video className="w-10 h-10 text-red-500" />
                    ) : (
                      <VideoOff className="w-10 h-10 text-gray-500" />
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {hasPermission === false
                      ? "Camera permission denied"
                      : "Camera is off"}
                  </p>
                </div>
              </div>
            )}

            {/* Audio Level Indicator */}
            {isAudioEnabled && audioLevel > 0.1 && (
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <div
                  className="w-1 bg-green-500 rounded-full transition-all"
                  style={{ height: `${8 + audioLevel * 16}px` }}
                />
                <div
                  className="w-1 bg-green-500 rounded-full transition-all"
                  style={{ height: `${12 + audioLevel * 20}px` }}
                />
                <div
                  className="w-1 bg-green-500 rounded-full transition-all"
                  style={{ height: `${8 + audioLevel * 16}px` }}
                />
              </div>
            )}

            {/* Preview Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={onToggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  isAudioEnabled
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={onToggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  isVideoEnabled
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* User Name Tag */}
            <div className="absolute bottom-4 left-4">
              <span className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm font-medium">
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
            <h1 className="text-3xl font-bold text-white mb-2">
              Ready to join?
            </h1>
            <p className="text-gray-400 mb-8">
              Check your audio and video settings before joining the meeting.
            </p>

            {/* Meeting Info */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{meetingName}</h3>
                  <p className="text-sm text-gray-400">{roomName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>Joining meeting...</span>
              </div>
            </div>

            {/* Device Status */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {isAudioEnabled ? (
                    <Mic className="w-5 h-5 text-green-500" />
                  ) : (
                    <MicOff className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-gray-300">Microphone</span>
                </div>
                <span
                  className={`text-sm ${isAudioEnabled ? "text-green-500" : "text-red-500"}`}
                >
                  {isAudioEnabled ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {isVideoEnabled ? (
                    <Video className="w-5 h-5 text-green-500" />
                  ) : (
                    <VideoOff className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-gray-300">Camera</span>
                </div>
                <span
                  className={`text-sm ${isVideoEnabled ? "text-green-500" : "text-red-500"}`}
                >
                  {isVideoEnabled ? "On" : "Off"}
                </span>
              </div>
            </div>

            {/* Join Button */}
            <button
              onClick={onJoin}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              Join Meeting
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
