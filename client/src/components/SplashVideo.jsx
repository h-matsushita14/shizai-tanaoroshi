import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { useMasterData } from '../contexts/MasterDataContext';
import { sendGetRequest } from '../api/gas';

const SplashVideo = ({ onVideoEnd }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const { setMasterData, setIsLoadingMasterData, setMasterDataError } = useMasterData();
  const theme = useTheme();

  // マスターデータフェッチ
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingMasterData(true);
      setMasterDataError(null);
      try {
        const result = await sendGetRequest('getMasterData');
        if (result.status === 'success') {
          setMasterData(result.data);
        } else {
          throw new Error(result.message || 'マスターデータの取得に失敗しました。');
        }
      } catch (err) {
        setMasterDataError(err.message);
        console.error('Error fetching master data:', err);
      } finally {
        setIsLoadingMasterData(false);
      }
    };
    fetchMasterData();
  }, [setMasterData, setIsLoadingMasterData, setMasterDataError]);

  // ビデオ再生と終了処理
  useEffect(() => {
    const videoElement = document.getElementById('splash-video');
    if (videoElement) {
      videoElement.play();
      videoElement.onended = () => {
        setVideoEnded(true);
      };
    }

    // Fallback for cases where video might not play or onended doesn't fire
    const timer = setTimeout(() => {
      setVideoEnded(true);
    }, 8000); // Hide after 8 seconds if video doesn't end

    return () => {
      clearTimeout(timer);
      if (videoElement) {
        videoElement.onended = null;
      }
    };
  }, []);

  // ビデオ終了とデータロード完了を待ってからonVideoEndを呼び出す
  const { isLoadingMasterData: isMasterDataLoading } = useMasterData();
  useEffect(() => {
    if (videoEnded && !isMasterDataLoading && onVideoEnd) {
      setShowSplash(false);
      onVideoEnd();
    }
  }, [videoEnded, isMasterDataLoading, onVideoEnd]);

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