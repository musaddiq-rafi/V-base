"use client";

import { ArrowRight, Code, Users, Video, Trello, CheckCircle2, Zap, Shield, Layers } from 'lucide-react';
import { Logo } from './ui/logo';
import { MovingBorderButton } from './ui/moving-border-button';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [stars, setStars] = useState<{ x: number; y: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate random stars for the background
  useEffect(() => {
    const newStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white overflow-x-hidden relative">
      {/* Animated Background with Stars and Galaxy */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Galaxy gradient orbs */}
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-purple-500/30 via-blue-500/20 to-transparent blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[20%] left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-radial from-indigo-500/20 via-sky-500/15 to-transparent blur-[120px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>

        {/* Sparkling stars */}
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Additional glowing planet effect */}
        <div className="absolute top-[15%] left-[15%] w-[300px] h-[300px]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-purple-600/30 blur-[80px] animate-spin-slow"></div>
          <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-blue-300/40 via-indigo-400/30 to-violet-500/40 blur-[60px] animate-pulse"></div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes blurIn {
          from { opacity: 0; filter: blur(10px); transform: scale(0.95); }
          to { opacity: 1; filter: blur(0px); transform: scale(1); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.8s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.7s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.7s ease-out forwards;
        }
        .animate-blur-in {
          animation: blurIn 1s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-delay-100 { animation-delay: 0.1s; }
        .animate-delay-200 { animation-delay: 0.2s; }
        .animate-delay-300 { animation-delay: 0.3s; }
        .animate-delay-400 { animation-delay: 0.4s; }
        .animate-delay-500 { animation-delay: 0.5s; }
        .animate-delay-600 { animation-delay: 0.6s; }
        .animate-delay-700 { animation-delay: 0.7s; }
        .glass {
          background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }
        .glass:hover {
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(16px);
        }
        .section-divider {
          position: relative;
        }
        .section-divider::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 72rem;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
        }
      `}</style>

      {/* Header */}
      <header
        className="fixed top-0 inset-x-0 z-50 opacity-0 animate-fade-in border-white/10 border-b transition-all duration-300 relative glass"
        style={{
          opacity: 1,
          transform: `translateY(${scrollY > 50 ? '0px' : '0px'})`
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="inline-flex items-center gap-2 hover:scale-105 transition-transform duration-200">
            <span className="text-xl">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">V</span>
              <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Base</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a className="text-white/60 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-sky-400 after:transition-all after:duration-200 hover:after:w-full" href="#features">Features</a>
            <a className="text-white/60 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-sky-400 after:transition-all after:duration-200 hover:after:w-full" href="#how">How it works</a>
            <a className="text-white/60 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-sky-400 after:transition-all after:duration-200 hover:after:w-full" href="#pricing">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-white/70 hover:text-white hover:bg-white/10"
            >
              Sign in
            </button>
            <Button
              onClick={onGetStarted}
              size="sm"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="h-16"></div>

      {/* Hero Section */}
      <section className="relative overflow-hidden z-10">
        <div className="max-w-7xl sm:px-6 lg:px-8 sm:py-28 mr-auto ml-auto pt-20 pr-4 pb-20 pl-4">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            {/* VBase Brand */}
            <div className="flex items-center justify-center opacity-0 animate-blur-in" style={{ opacity: 1 }}>
              <span className="text-5xl sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">V</span>
                <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Base</span>
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-white opacity-0 animate-blur-in tracking-tighter animate-delay-200" style={{ opacity: 1 }}>
              Virtual Workspace. <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400 tracking-tighter">Supercharged.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto opacity-0 animate-slide-up animate-delay-300" style={{ opacity: 1 }}>
              Create collaborative workspaces with integrated coding rooms, whiteboards, video meetings, and Kanban boards. All in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 opacity-0 animate-scale-in animate-delay-500 relative z-10" style={{ opacity: 1 }}>
              <MovingBorderButton
                onClick={onGetStarted}
                duration={3000}
                borderRadius="0.75rem"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </MovingBorderButton>
            </div>
          </div>

          {/* Product Preview */}
          <div className="sm:mt-24 opacity-0 animate-blur-in animate-delay-700 relative mt-16 transition-transform duration-500 hover:-translate-y-2" style={{ opacity: 1 }}>
            <div className="relative rounded-3xl border border-white/20 bg-gradient-to-b from-slate-900/40 to-slate-800/30 shadow-[0_10px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden hover:shadow-[0_20px_80px_-15px_rgba(0,0,0,0.8)] hover:border-white/15 transition-all duration-500 backdrop-blur-xl">
              <div className="pointer-events-none absolute -inset-px rounded-[1.45rem] bg-[radial-gradient(80%_60%_at_50%_0%,rgba(90,97,255,0.25),transparent_60%)]"></div>
              <div className="relative pt-8 pr-8 pb-8 pl-8">
                <div className="relative mx-auto w-full">
                  <div className="absolute inset-0 translate-y-8 scale-[0.96] rounded-2xl bg-slate-900/50 ring-1 ring-white/5 blur-[0.3px]"></div>
                  <div className="absolute inset-0 ring-1 ring-white/5 bg-slate-900/60 rounded-2xl translate-y-4 scale-[0.98]"></div>
                  <div className="relative rounded-2xl bg-[linear-gradient(180deg,rgba(19,24,31,0.9),rgba(10,13,18,0.9))] ring-1 ring-white/10 overflow-hidden hover:ring-white/15 transition-all duration-300">
                    <div className="flex hover:bg-slate-950/70 transition-all duration-300 bg-slate-950/50 border-white/5 rounded-2xl border-b pt-4 pr-6 pb-4 pl-6 backdrop-blur items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60 hover:bg-red-500 transition-colors duration-200"></span>
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60 hover:bg-amber-500 transition-colors duration-200"></span>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60 hover:bg-emerald-500 transition-colors duration-200"></span>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-300 shadow-inner shadow-black/20">
                        <span className="text-slate-400/80">VBase Workspace</span>
                      </div>
                      <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-sm text-white shadow-sky-500/25 hover:shadow-sky-500/40 transition-all hover:scale-105">
                        <Code className="h-4 w-4" />
                        New Room
                      </button>
                    </div>
                    <div className="relative h-80">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(87,107,255,0.08),transparent_50%)]"></div>
                      <div className="absolute inset-0 overflow-hidden pt-6 pr-6 pb-6 pl-6 space-y-4">
                        {/* Room Items */}
                        {[
                          { icon: Code, name: 'Coding Room', status: 'Active', color: 'from-purple-400 to-purple-600', badge: 'code', users: 'JS' },
                          { icon: Trello, name: 'Kanban Board', status: 'In Progress', color: 'from-green-400 to-green-600', badge: 'tasks', users: 'KM' },
                          { icon: Video, name: 'Meeting Room', status: 'Live', color: 'from-blue-400 to-blue-600', badge: 'video', users: 'TR' },
                          { icon: Layers, name: 'Whiteboard', status: 'Brainstorming', color: 'from-orange-400 to-orange-600', badge: 'design', users: 'AK' }
                        ].map((room) => (
                          <div key={room.name} className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/40 border border-white/5 hover:bg-slate-900/80 hover:border-white/10 transition-all duration-300 group">
                            <div className="h-4 w-4 rounded border-2 border-purple-500/60 bg-purple-500/10 group-hover:border-purple-500 group-hover:bg-purple-500/20 transition-all duration-200"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-slate-200 font-medium truncate group-hover:text-white transition-colors duration-200">{room.name}</span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">{room.badge}</span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1 group-hover:text-slate-300 transition-colors duration-200">{room.status}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`h-6 w-6 rounded-full bg-gradient-to-br ${room.color} flex items-center justify-center text-xs text-white font-semibold group-hover:scale-110 transition-transform duration-200`}>{room.users}</span>
                              <room.icon className="h-4 w-4 text-slate-500 group-hover:text-slate-400 transition-colors duration-200" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B0F14] to-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative z-10 pt-8 pr-8 pb-8 pl-8">
                <div className="w-full px-2 py-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    Real-time Collaboration
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <h2 className="mt-4 text-3xl sm:text-4xl text-white tracking-tighter">Collaborative Workspaces</h2>
                  <p className="sm:text-lg text-base text-slate-400 mt-4">
                    Create virtual offices with specialized rooms for every team need. From coding together to brainstorming on whiteboards, VBase brings your team together in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for other sections */}
      <div className="h-20"></div>

      {/* Features Section */}
      <section id="features" className="relative sm:py-28 section-divider pt-20 pb-20 space-y-20 z-10">
        <div className="max-w-7xl sm:px-6 lg:px-8 mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl text-white opacity-0 animate-blur-in tracking-tighter" style={{ opacity: 1 }}>
              Built for modern teams
            </h2>
            <p className="mt-4 text-lg text-white/70 opacity-0 animate-slide-up animate-delay-200" style={{ opacity: 1 }}>
              Every tool your team needs to collaborate effectively in one unified workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="hover:bg-white/8 hover:border-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-500 opacity-0 animate-blur-in animate-delay-300 group bg-white/5 border-white/10 border rounded-2xl pt-8 pr-8 pb-8 pl-8" style={{ opacity: 1 }}>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 flex items-center justify-center mb-6 group-hover:from-sky-500/40 group-hover:to-sky-600/40 group-hover:scale-110 transition-all duration-300">
                <Users className="h-6 w-6 text-sky-400 group-hover:rotate-12 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-sky-300 transition-colors duration-300">Real-time Collaboration</h3>
              <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">Work together seamlessly with instant updates across all workspace rooms and tools.</p>
            </div>

            <div className="hover:bg-white/8 hover:border-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-500 opacity-0 animate-blur-in animate-delay-400 group bg-white/5 border-white/10 border rounded-2xl pt-8 pr-8 pb-8 pl-8" style={{ opacity: 1 }}>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 flex items-center justify-center mb-6 group-hover:from-indigo-500/40 group-hover:to-indigo-600/40 group-hover:scale-110 transition-all duration-300">
                <Zap className="h-6 w-6 text-indigo-400 group-hover:scale-125 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-300 transition-colors duration-300">Lightning fast</h3>
              <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">Built for speed with optimized performance and real-time synchronization.</p>
            </div>

            <div className="hover:bg-white/8 hover:border-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-500 opacity-0 animate-blur-in animate-delay-500 group bg-white/5 border-white/10 border rounded-2xl pt-8 pr-8 pb-8 pl-8" style={{ opacity: 1 }}>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center mb-6 group-hover:from-amber-500/40 group-hover:to-amber-600/40 group-hover:scale-110 transition-all duration-300">
                <Shield className="h-6 w-6 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-amber-300 transition-colors duration-300">Secure by default</h3>
              <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">Enterprise-grade security with encrypted connections and private workspaces.</p>
            </div>
          </div>
        </div>

        {/* Room Features Grid */}
        <div className="max-w-7xl sm:px-6 lg:px-8 mt-20 mr-auto ml-auto pr-4 pl-4">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl text-white opacity-0 animate-blur-in animate-delay-600 tracking-tighter" style={{ opacity: 1 }}>
              Specialized rooms for every workflow
            </h2>
            <p className="mt-4 text-lg text-white/70 opacity-0 animate-slide-up animate-delay-700" style={{ opacity: 1 }}>
              From coding together to planning sprints, VBase has the perfect room for every task.
            </p>
          </div>

          {/* Grid of room features */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Coding Room */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 hover:border-white/20 hover:bg-white/8 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Code className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">Coding Room</h3>
                <p className="text-white/70 leading-relaxed mb-4 group-hover:text-white/90 transition-colors duration-300">
                  Integrated online IDE with syntax highlighting, real-time collaborative editing, and instant code sharing.
                </p>
                <ul className="space-y-2">
                  {['Live code collaboration', 'Syntax highlighting', 'Multiple language support'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white/80 transition-colors duration-200">
                      <CheckCircle2 className="h-4 w-4 text-purple-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Whiteboard Room */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 hover:border-white/20 hover:bg-white/8 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Layers className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl text-white mb-3 group-hover:text-orange-300 transition-colors duration-300">Whiteboard</h3>
                <p className="text-white/70 leading-relaxed mb-4 group-hover:text-white/90 transition-colors duration-300">
                  Infinite collaborative canvas for brainstorming, sketching ideas, and visual planning with your team.
                </p>
                <ul className="space-y-2">
                  {['Drawing tools & shapes', 'Sticky notes & text', 'Export & save boards'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white/80 transition-colors duration-200">
                      <CheckCircle2 className="h-4 w-4 text-orange-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Meeting Room */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 hover:border-white/20 hover:bg-white/8 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Video className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">Meeting Room</h3>
                <p className="text-white/70 leading-relaxed mb-4 group-hover:text-white/90 transition-colors duration-300">
                  High-quality video calls with screen sharing, chat, and meeting controls for seamless virtual meetings.
                </p>
                <ul className="space-y-2">
                  {['HD video & audio', 'Screen sharing', 'Real-time chat'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white/80 transition-colors duration-200">
                      <CheckCircle2 className="h-4 w-4 text-blue-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Kanban Room */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 hover:border-white/20 hover:bg-white/8 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Trello className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl text-white mb-3 group-hover:text-green-300 transition-colors duration-300">Kanban Board</h3>
                <p className="text-white/70 leading-relaxed mb-4 group-hover:text-white/90 transition-colors duration-300">
                  Visual task management with drag-and-drop cards, custom columns, and real-time updates for agile teams.
                </p>
                <ul className="space-y-2">
                  {['Drag & drop cards', 'Custom columns', 'Task assignments'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white/80 transition-colors duration-200">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how" className="relative sm:py-28 section-divider pt-20 pb-20 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="opacity-0 animate-slide-in-left animate-delay-300" style={{ opacity: 1 }}>
              <h2 className="text-3xl sm:text-4xl text-white mb-6 tracking-tighter">
                From idea to execution, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 tracking-tighter">without switching tools</span>
              </h2>
              <p className="text-lg text-white/70 mb-8 leading-relaxed">
                Create workspaces for different projects and teams. Each workspace contains specialized rooms that sync in real-time, keeping everyone on the same page.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 group hover:bg-white/5 rounded-lg p-3 transition-all duration-200">
                  <div className="h-6 w-6 rounded-full bg-sky-500/20 flex items-center justify-center mt-0.5 group-hover:bg-sky-500/30 group-hover:scale-110 transition-all duration-200">
                    <CheckCircle2 className="h-3 w-3 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1 group-hover:text-sky-300 transition-colors duration-200">Create unlimited workspaces</h4>
                    <p className="text-white/70 text-sm group-hover:text-white/90 transition-colors duration-200">Organize your team with separate workspaces for projects, departments, or clients.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group hover:bg-white/5 rounded-lg p-3 transition-all duration-200">
                  <div className="h-6 w-6 rounded-full bg-sky-500/20 flex items-center justify-center mt-0.5 group-hover:bg-sky-500/30 group-hover:scale-110 transition-all duration-200">
                    <CheckCircle2 className="h-3 w-3 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1 group-hover:text-sky-300 transition-colors duration-200">Add specialized rooms</h4>
                    <p className="text-white/70 text-sm group-hover:text-white/90 transition-colors duration-200">Each workspace can contain coding, whiteboard, meeting, and Kanban rooms.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group hover:bg-white/5 rounded-lg p-3 transition-all duration-200">
                  <div className="h-6 w-6 rounded-full bg-sky-500/20 flex items-center justify-center mt-0.5 group-hover:bg-sky-500/30 group-hover:scale-110 transition-all duration-200">
                    <CheckCircle2 className="h-3 w-3 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1 group-hover:text-sky-300 transition-colors duration-200">Invite team members</h4>
                    <p className="text-white/70 text-sm group-hover:text-white/90 transition-colors duration-200">Share workspace access and collaborate with your team in real-time.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/60 transition-all gap-2 group"
                >
                  Try free trial
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            <div className="opacity-0 animate-slide-in-right animate-delay-400" style={{ opacity: 1 }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 blur-3xl"></div>
                <div className="relative glass rounded-2xl p-8 border border-white/10 hover:border-white/15 hover:shadow-2xl transition-all duration-500">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">Workspace Activity</h3>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-xs text-white/60">Live</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 transition-all duration-300 group">
                        <div className="flex items-center gap-3">
                          <Code className="h-5 w-5 text-white/60 group-hover:text-white/80 transition-colors duration-200" />
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-sky-300 transition-colors duration-200">Code deployed</p>
                            <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200">2 seconds ago</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-green-400 group-hover:scale-110 transition-transform duration-200">✓ main</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 transition-all duration-300 group">
                        <div className="flex items-center gap-3">
                          <Layers className="h-5 w-5 text-white/60 group-hover:text-white/80 transition-colors duration-200" />
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-sky-300 transition-colors duration-200">Design updated</p>
                            <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200">5 seconds ago</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-green-400 group-hover:scale-110 transition-transform duration-200">✓ 3 items</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 transition-all duration-300 group">
                        <div className="flex items-center gap-3">
                          <Trello className="h-5 w-5 text-white/60 group-hover:text-white/80 transition-colors duration-200" />
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-sky-300 transition-colors duration-200">Tasks moved</p>
                            <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200">12 seconds ago</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-green-400 group-hover:scale-110 transition-transform duration-200">✓ 5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative max-w-7xl mr-auto ml-auto pt-20 pr-6 pb-20 pl-6 z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="sm:text-4xl text-3xl text-neutral-50 tracking-tighter">Choose Your VBase Plan</h1>
          <p className="mt-3 text-white/70">Fast, powerful, collaborative. Pick the plan that fits your team&apos;s needs.</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-14" style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          {/* STARTER */}
          <div className="group relative">
            <div className="relative w-full overflow-visible [perspective:1200px]">
              {/* Back page that follows the front cover */}
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-blue-500/15 via-blue-600/25 to-blue-800/35 ring-1 ring-white/10 shadow-2xl [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(45deg)_translateX(-20px)_translateZ(-30px)_translateY(-15px)_scale(0.95)]"></div>

              {/* Glass cover with book opening effect */}
              <div className="relative z-10 rounded-[28px] shadow-2xl p-7 sm:p-8 min-h-[420px] flex flex-col justify-between [transform-style:preserve-3d] origin-left [transform:rotateY(0deg)] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(-10deg)_translateY(-12px)_translateZ(10px)] transform-gpu" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                <div>
                  <div className="text-center">
                    <div className="text-xs tracking-[0.2em] text-white/70 mb-3">STARTER</div>
                    <div className="text-5xl leading-none text-white tracking-tighter">Free</div>
                    <div className="mt-2 text-white/70">Trial</div>
                  </div>

                  <ul className="mt-8 space-y-3 text-[15px]">
                    <li className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-sky-400" />
                      <span>Up to 3 workspaces</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-sky-400" />
                      <span>All room types</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-sky-400" />
                      <span>Community support</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={onGetStarted}
                    className="w-full bg-white/90 hover:bg-white/95 text-black shadow-[0_6px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* PRO */}
          <div className="group relative">
            <div className="relative w-full overflow-visible [perspective:1200px]">
              {/* Back page that follows the front cover */}
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-sky-500/15 via-sky-600/25 to-indigo-800/35 ring-1 ring-white/10 shadow-2xl [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(45deg)_translateX(-20px)_translateZ(-30px)_translateY(-15px)_scale(0.95)]"></div>

              {/* Glass cover with book opening effect */}
              <div className="relative z-10 rounded-[28px] shadow-2xl p-7 sm:p-8 min-h-[420px] flex flex-col justify-between [transform-style:preserve-3d] origin-left [transform:rotateY(0deg)] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(-10deg)_translateY(-12px)_translateZ(10px)] transform-gpu" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.08))', backdropFilter: 'blur(20px)', border: '1px solid rgba(56,189,248,0.3)', boxShadow: '0 8px 32px rgba(56,189,248,0.2), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                <div>
                  <div className="text-center">
                    <div className="text-xs tracking-[0.2em] text-sky-300 mb-3">PRO</div>
                    <div className="text-5xl leading-none text-white tracking-tighter">$15<span className="text-lg align-super">/mo</span></div>
                    <div className="mt-2 text-white/70">Best for teams</div>
                  </div>

                  <ul className="mt-8 space-y-3 text-[15px]">
                    <li className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-sky-300" />
                      Unlimited workspaces
                    </li>
                    <li className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-sky-300" />
                      Advanced collaboration
                    </li>
                    <li className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-sky-300" />
                      Priority support
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={onGetStarted}
                    className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-[0_6px_24px_rgba(56,189,248,0.4)] hover:shadow-[0_8px_32px_rgba(56,189,248,0.5)] transition-all"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="group relative">
            <div className="relative w-full overflow-visible [perspective:1200px]">
              {/* Back page that follows the front cover */}
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-violet-500/15 via-purple-600/25 to-indigo-800/35 ring-1 ring-white/10 shadow-2xl [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(45deg)_translateX(-20px)_translateZ(-30px)_translateY(-15px)_scale(0.95)]"></div>

              {/* Glass cover with book opening effect */}
              <div className="relative z-10 rounded-[28px] shadow-2xl p-7 sm:p-8 min-h-[420px] flex flex-col justify-between [transform-style:preserve-3d] origin-left [transform:rotateY(0deg)] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(-10deg)_translateY(-12px)_translateZ(10px)] transform-gpu" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(147,51,234,0.08))', backdropFilter: 'blur(20px)', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 8px 32px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                <div>
                  <div className="text-center">
                    <div className="text-xs tracking-[0.2em] text-violet-300 mb-3">ENTERPRISE</div>
                    <div className="text-5xl leading-none text-white tracking-tighter">$49<span className="text-lg align-super">/mo</span></div>
                    <div className="mt-2 text-white/70">For organizations</div>
                  </div>

                  <ul className="mt-8 space-y-3 text-[15px]">
                    <li className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-violet-300" />
                      Unlimited everything
                    </li>
                    <li className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-violet-300" />
                      Custom integrations
                    </li>
                    <li className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-violet-300" />
                      24/7 dedicated support
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={onGetStarted}
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white shadow-[0_6px_24px_rgba(168,85,247,0.4)] hover:shadow-[0_8px_32px_rgba(168,85,247,0.5)] transition-all"
                  >
                    Go Enterprise
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-radial from-sky-500/20 via-violet-500/10 to-transparent blur-[120px]"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="section-divider border-white/10 border-t pt-16 pb-16 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex gap-3 group hover:scale-105 transition-transform duration-200 cursor-pointer mb-4 items-center">
                <Logo className="w-9 h-9 text-white" />
                <span className="text-xl">
                  <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">V</span>
                  <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Base</span>
                </span>
              </div>
              <p className="text-white/60 text-sm max-w-md mb-6">
                The ultimate collaborative virtual workspace with integrated coding, whiteboards, video meetings, and Kanban boards.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-white/60 hover:text-white transition-all duration-200 hover:scale-110">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-all duration-200 hover:scale-110">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-all duration-200 hover:scale-110">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block">Features</a></li>
                <li><a href="#" className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block">Integrations</a></li>
                <li><a href="#" className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block">Pricing</a></li>
                <li><a href="#" className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block">Documentation</a></li>
                <li><a href="#" className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block">Help Center</a></li>
                <li><a href="#" className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block">Contact</a></li>
                <li><a href="#" className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row border-white/10 border-t mt-12 pt-8 items-center justify-between">
            <p className="text-white/50 text-sm">© 2026 VBase. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm mt-4 sm:mt-0">
              <a href="#" className="text-white/50 hover:text-white/70 hover:scale-105 transition-all duration-200">Privacy</a>
              <a href="#" className="text-white/50 hover:text-white/70 hover:scale-105 transition-all duration-200">Terms</a>
              <a href="#" className="text-white/50 hover:text-white/70 hover:scale-105 transition-all duration-200">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
