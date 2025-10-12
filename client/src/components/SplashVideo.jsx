import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material';

const SplashVideo = ({ onVideoEnd }) => {
  const [showSplash, setShowSplash] = useState(true);
  const theme = useTheme(); // useTheme を追加

  useEffect(() => {
    const videoElement = document.getElementById('splash-video');
    if (videoElement) {
      videoElement.play();
      videoElement.onended = () => {
        setShowSplash(false);
        if (onVideoEnd) {
          onVideoEnd();
        }
      };
    }

    // Fallback for cases where video might not play or onended doesn't fire
    const timer = setTimeout(() => {
      setShowSplash(false);
      if (onVideoEnd) {
        onVideoEnd();
      }
    }, 8000); // Hide after 8 seconds if video doesn't end

    return () => {
      clearTimeout(timer);
      if (videoElement) {
        videoElement.onended = null;
      }
    };
  }, [onVideoEnd]);

  if (!showSplash) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: theme.palette.primary.main, // テーマのプライマリカラーを使用
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    }}>
      <video
        id="splash-video"
        src="/KISUKE FOODS.mp4"
        muted
        playsInline
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export default SplashVideo;