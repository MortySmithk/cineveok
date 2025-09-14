// app/components/CineVEOPlayer.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './CineVEOPlayer.module.css';
import Image from 'next/image';

// --- Ícones SVG definidos diretamente no componente para corresponder ao design ---
const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const Rewind10Icon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 6V4H6v2.21c1.65.65 3 2.17 3 4.04v1.5c0 .53-.13.99-.32 1.41L11 15.5V18h1.5v-2.05c2.14-.98 3.5-3.17 3.5-5.69V8.5c0-1.65-1.07-3.09-2.5-3.5zm-6 4.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5z"></path><path d="M11 10.5v-.01c0-.28-.22-.5-.5-.5s-.5.22-.5.5v.01c0 .28.22.5.5.5s.5-.22.5-.5z" transform="scale(0.8) translate(2, 2)"></path><text x="7" y="15" fontSize="5" fill="white" style={{fontWeight: 'bold'}}>10</text></svg>;
const Forward10Icon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 6V4H18v2.21c-1.65.65-3 2.17-3 4.04v1.5c0 .53.13.99.32 1.41L13 15.5V18h-1.5v-2.05c-2.14-.98-3.5-3.17-3.5-5.69V8.5c0-1.65 1.07-3.09 2.5-3.5zm6 4.5c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5s2.5-1.12-2.5-2.5z"></path><path d="M13 10.5v-.01c0-.28.22-.5.5-.5s.5.22.5.5v.01c0 .28-.22.5.5.5s-.5-.22-.5-.5z" transform="scale(0.8) translate(2, 2)"></path><text x="10" y="15" fontSize="5" fill="white" style={{fontWeight: 'bold'}}>10</text></svg>;
const VolumeMuteIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>;
const VolumeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17-.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69-.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></svg>;
const FullscreenEnterIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zm-3-12V5h-2v5h5V8h-3z"></path></svg>;
const FullscreenExitIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg>;
const PlaybackSpeedIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 8v8l6-4-6-4zm11.99-3-1.41-1.41-4.24 4.24-1.42-1.41-1.41 1.41 4.24 4.24-1.42 1.41L18 13.01V7h-5.01l1.59 1.59L12 11.17l-1.41-1.41-4.24 4.24 1.41 1.41 4.24-4.24 1.41 1.41 1.41-1.41-4.24-4.24 1.41-1.41 4.24 4.24L17 7.01h4.99z"></path></svg>;

interface CineVEOPlayerProps { src: string; }

const CineVEOPlayer: React.FC<CineVEOPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeout = useRef<NodeJS.Timeout>();

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLogoVisible, setIsLogoVisible] = useState(false);
  const [seekFeedback, setSeekFeedback] = useState<'forward' | 'backward' | null>(null);

  const togglePlay = useCallback(() => {
    if (videoRef.current?.paused) videoRef.current?.play();
    else videoRef.current?.pause();
  }, []);

  const formatTime = (time: number) => {
    const date = new Date(0);
    date.setSeconds(time || 0);
    return date.toISOString().substr(14, 5);
  };

  const triggerFeedback = (type: 'forward' | 'backward') => {
    setSeekFeedback(type);
    setTimeout(() => setSeekFeedback(null), 500);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.autoplay = true;
    
    setIsLogoVisible(false);
    const handleTimeUpdate = () => {
      if (video && video.currentTime >= 5 && !isLogoVisible) {
        setIsLogoVisible(true);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
    video?.addEventListener('timeupdate', handleTimeUpdate);
    return () => video?.removeEventListener('timeupdate', handleTimeUpdate);
  }, [src, isLogoVisible]);

  const toggleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) container.requestFullscreen().catch(err => console.error(err));
    else document.exitFullscreen();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const playerContainer = playerContainerRef.current;
    if (!video || !playerContainer) return;

    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const updateState = () => {
      if (!video) return;
      setIsPlaying(!video.paused); setIsMuted(video.muted); setVolume(video.volume);
      setCurrentTime(video.currentTime); setDuration(video.duration);
    };
    const updateBuffered = () => video.buffered.length > 0 && setBuffered(video.buffered.end(video.buffered.length - 1));
    const showLoading = () => setIsLoading(true);
    const hideLoading = () => setIsLoading(false);
    
    const hideControls = () => !video.paused && setAreControlsVisible(false);
    const showControls = () => {
        setAreControlsVisible(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(hideControls, 3000);
    };

    video.addEventListener('play', updateState); video.addEventListener('pause', updateState);
    video.addEventListener('volumechange', updateState); video.addEventListener('timeupdate', updateState);
    video.addEventListener('loadedmetadata', updateState); video.addEventListener('progress', updateBuffered);
    video.addEventListener('waiting', showLoading); video.addEventListener('playing', hideLoading);
    
    playerContainer.addEventListener('mousemove', showControls);
    playerContainer.addEventListener('mouseleave', hideControls);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      e.preventDefault();
      switch (e.key.toLowerCase()) {
        case ' ': togglePlay(); break; case 'f': toggleFullscreen(); break; case 'm': video.muted = !video.muted; break;
        case 'arrowright': video.currentTime += 10; triggerFeedback('forward'); break;
        case 'arrowleft': video.currentTime -= 10; triggerFeedback('backward'); break;
        case 'arrowup': video.volume = Math.min(1, video.volume + 0.1); break;
        case 'arrowdown': video.volume = Math.max(0, video.volume - 0.1); break;
      }
    };
    playerContainer.addEventListener('keydown', handleKeyDown);

    return () => {
      video.removeEventListener('play', updateState); video.removeEventListener('pause', updateState);
      playerContainer.removeEventListener('keydown', handleKeyDown); document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [src, togglePlay, toggleFullscreen]);

  return (
    <div ref={playerContainerRef} className={`${styles.playerContainer} ${!areControlsVisible && styles.hideCursor}`} tabIndex={0}>
      <video ref={videoRef} src={src} className={styles.videoElement} />
      
      {isLoading && <div className={styles.loadingSpinner}></div>}
      
      <div className={`${styles.centerControls} ${!isPlaying && areControlsVisible ? styles.visible : ''}`} onClick={togglePlay}>
          <div className={styles.centerPlayButton}><PlayIcon /></div>
      </div>

      <Image src="https://i.ibb.co/s91tyczd/Gemini-Generated-Image-ejjiocejjiocejji-1.png" alt="Logo" className={`${styles.logoWatermark} ${isLogoVisible ? styles.visible : ''}`} width={130} height={32} style={{ objectFit: 'contain' }}/>
      
      <div className={`${styles.controlsOverlay} ${!areControlsVisible && styles.hidden}`} onClick={(e) => { if (e.target === e.currentTarget) togglePlay(); }}>
        <div className={styles.bottomGradient}></div>
        <div className={styles.controlsContainer}>
          <div className={styles.progressBar} onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            if(videoRef.current) videoRef.current.currentTime = percent * duration;
          }}>
            <div className={styles.progressTrack}>
              <div className={styles.progressBuffer} style={{ width: `${(buffered / duration) * 100}%` }}></div>
              <div className={styles.progressFill} style={{ width: `${(currentTime / duration) * 100}%` }}>
                <div className={styles.progressThumb}></div>
              </div>
            </div>
          </div>
          
          <div className={styles.bottomControls}>
            <div className={styles.controlsGroup}>
              {/* --- LINHA CORRIGIDA ABAIXO --- */}
              <button onClick={togglePlay} className={styles.controlButton} title={isPlaying ? 'Pausar' : 'Assistir'}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
              <button onClick={() => {if(videoRef.current) videoRef.current.currentTime -=10; triggerFeedback('backward');}} className={styles.controlButton} title="Voltar 10 Segundos"><Rewind10Icon /></button>
              <button onClick={() => {if(videoRef.current) videoRef.current.currentTime +=10; triggerFeedback('forward');}} className={styles.controlButton} title="Avançar 10 Segundos"><Forward10Icon /></button>
              <div className={styles.volumeContainer}>
                <button onClick={() => videoRef.current && (videoRef.current.muted = !videoRef.current.muted)} className={styles.controlButton} title={isMuted ? 'Ativar som' : 'Silenciar'}>{isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}</button>
                <div className={styles.volumeSliderContainer}>
                  <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onInput={(e) => {if(videoRef.current) {videoRef.current.volume = Number(e.currentTarget.value); videoRef.current.muted = Number(e.currentTarget.value) === 0;}}} className={styles.volumeSlider} />
                </div>
              </div>
              <div className={styles.timeDisplay}>{formatTime(currentTime)} / {formatTime(duration)}</div>
            </div>
            
            <div className={styles.controlsGroup}>
              <div className={styles.settingsContainer}>
                <button onClick={() => setShowSettings(!showSettings)} className={styles.controlButton} title="Definições"><SettingsIcon /></button>
                {showSettings && (
                  <div className={styles.settingsMenu}>
                    <div className={styles.settingsMenuItem}>
                      <PlaybackSpeedIcon /> <span>Velocidade</span>
                    </div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <button key={rate} onClick={() => {if(videoRef.current) videoRef.current.playbackRate = rate; setPlaybackRate(rate); setShowSettings(false);}} className={playbackRate === rate ? styles.active : ''}>{rate === 1 ? 'Normal' : `${rate}x`}</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={toggleFullscreen} className={styles.controlButton} title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>{isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CineVEOPlayer;