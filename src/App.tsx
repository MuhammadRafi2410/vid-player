import { PlayIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  const thumbnailUrl =
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2070&auto=format&fit=crop';

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/20 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-800/20 blur-3xl rounded-full" />

      {/* Navbar */}
      <header className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-4xl font-extrabold tracking-wide bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
            VID PLAYER
          </h1>

          <div className="hidden md:flex gap-6 text-gray-300 font-medium">
            <button className="hover:text-white transition">Home</button>
            <button className="hover:text-white transition">Trending</button>
            <button className="hover:text-white transition">Movies</button>
            <button className="hover:text-white transition">About</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left Content */}
          <div>
            <span className="bg-red-600/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold border border-red-500/20">
              Modern Streaming UI
            </span>

            <h2 className="mt-6 text-5xl font-black leading-tight">
              Watch Videos With
              <span className="block text-red-500">Modern Experience</span>
            </h2>

            <p className="mt-6 text-gray-300 text-lg leading-relaxed max-w-xl">
              Tampilan video player modern dengan desain glassmorphism,
              animasi halus, dan nuansa seperti Netflix serta YouTube modern.
            </p>

            <div className="mt-8 flex gap-4">
              <button className="bg-red-600 hover:bg-red-700 px-7 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-red-500/30">
                Start Watching
              </button>

              <button className="bg-white/10 backdrop-blur-lg border border-white/10 hover:bg-white/20 px-7 py-4 rounded-2xl font-bold transition-all duration-300">
                Explore
              </button>
            </div>
          </div>

          {/* Video Card */}
          <div className="relative">
export default App;
