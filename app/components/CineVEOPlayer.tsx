"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Os estilos foram movidos para dentro do componente para resolver problemas de compilação no ambiente de preview.
const playerCSS = `
.playerContainer {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
  color: #fff;
  overflow: hidden;
  font-family: 'Roboto', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
}
.playerContainer:focus {
  outline: none;
}
.playerContainer.hideCursor {
  cursor: none;
}
.videoElement {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.centerPlayOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 20;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
}
.centerPlayIcon {
  width: 80px;
  height: 80px;
  color: white;
  transition: transform 0.2s ease-in-out;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}
.centerPlayOverlay:hover .centerPlayIcon {
  transform: scale(1.1);
  filter: brightness(1.2) drop-shadow(0 2px 8px rgba(255,255,255,0.3));
}
.controlsOverlay {
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
  z-index: 21;
  padding: 8px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  transition: opacity 0.3s ease-in-out;
}
.controlsOverlay.hidden {
  opacity: 0;
  pointer-events: none;
}
.controlsOverlay.visible {
  opacity: 1;
  pointer-events: auto;
}
.progressBarContainer {
  width: 100%;
  height: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.progressTrack {
  position: relative;
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  transition: height 0.2s ease;
}
.progressBarContainer:hover .progressTrack {
  height: 6px;
}
.bufferedBar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}
.progressBar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #ffffff;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.progressThumb {
  width: 12px;
  height: 12px;
  background-color: #ffffff;
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.2s ease-in-out;
}
.progressBarContainer:hover .progressThumb {
  transform: scale(1);
}
.thumbnailContainer {
  position: absolute;
  bottom: 100%;
  margin-bottom: 8px;
  background-color: black;
  border: 1px solid #444;
  border-radius: 2px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  padding: 2px;
  pointer-events: none;
}
.thumbnailVideo {
  width: 160px;
  height: auto;
}
.thumbnailTime {
  position: absolute;
  bottom: 4px;
  right: 4px;
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 12px;
}
.bottomControls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}
.controlsGroup {
  display: flex;
  align-items: center;
  gap: 0px;
}
.controlButton {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.controlIcon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.volumeContainer {
  position: relative;
  display: flex;
  align-items: center;
}
.volumeSliderWrapper {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 12px;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 16px 8px;
  transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
  opacity: 0;
  visibility: hidden;
}
.volumeContainer:hover .volumeSliderWrapper {
    opacity: 1;
    visibility: visible;
}
.volumeSliderContainer {
  position: relative;
  width: 6px;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
}
.volumeSlider {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #ffffff;
  border-radius: 3px;
  display: flex;
  justify-content: center;
}
.volumeSliderThumb {
    position: absolute;
    top: -6px;
    width: 14px;
    height: 14px;
    background-color: white;
    border-radius: 50%;
    transform: scale(0);
    transition: transform 0.2s ease-in-out;
}
.volumeContainer:hover .volumeSliderThumb {
    transform: scale(1);
}
.timeDisplay {
  color: white;
  font-size: 14px;
  margin-left: 8px;
}
.settingsContainer {
  position: relative;
}
.settingsMenu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  width: 180px;
  padding: 4px;
}
.settingsMenuItem, .settingsMenuItemHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
}
.settingsMenuItem:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.settingsMenuItemHeader {
    border-bottom: 1px solid #444;
    margin-bottom: 4px;
}
.settingsValue {
  color: #aaa;
}
.settingsMenuItem.active {
    font-weight: bold;
}
.logoWatermark {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 24px;
  width: auto;
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  transform: translateY(100%);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.logoWatermark.visible {
  opacity: 1;
  transform: translateY(0);
}
`;

const PlayerStyles = () => <style>{playerCSS}</style>;


// --- Interfaces ---
interface ThumbnailState {
    time: number;
    percent: number;
    visible: boolean;
    x: number;
}

interface CineVEOPlayerProps {
    src: string;
}

// --- Componente Principal ---
const CineVEOPlayer: React.FC<CineVEOPlayerProps> = ({ src }) => {
    // --- Refs ---
    const videoRef = useRef<HTMLVideoElement>(null);
    const thumbnailVideoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const inactivityTimeoutRef = useRef<NodeJS.Timeout>();
    const volumeTimeoutRef = useRef<NodeJS.Timeout>();

    // --- State ---
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [areControlsVisible, setAreControlsVisible] = useState(true);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [isPlaybackRateMenuOpen, setIsPlaybackRateMenuOpen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLogoVisible, setIsLogoVisible] = useState(false);
    const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
    const [thumbnailState, setThumbnailState] = useState<ThumbnailState>({ time: 0, percent: 0, visible: false, x: 0 });

    // --- Funções de Controle ---
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused || videoRef.current.ended) {
            videoRef.current.play().catch(error => console.error("Erro ao tentar tocar o vídeo:", error));
        } else {
            videoRef.current.pause();
        }
    }, []);

    const toggleMute = useCallback(() => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
    }, []);
    
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            playerContainerRef.current?.requestFullscreen().catch(err => {
                console.error("Não foi possível ativar o modo de tela cheia:", err);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    // --- Handlers de Interação ---
    const handleVolumeChange = (newVolume: number) => {
        if (!videoRef.current) return;
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        videoRef.current.volume = clampedVolume;
        videoRef.current.muted = clampedVolume === 0;
    };

    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || isNaN(duration) || duration <= 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = percent * duration;
    };
    
    const handleProgressBarMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || isNaN(duration) || duration <= 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width;
        
        const thumbnailWidth = 160;
        let xPos = e.clientX - rect.left - (thumbnailWidth / 2);
        if (xPos < 0) xPos = 0;
        if (xPos + thumbnailWidth > rect.width) xPos = rect.width - thumbnailWidth;

        setThumbnailState({
            visible: true,
            percent: percent,
            time: percent * duration,
            x: xPos,
        });
    };

    const handlePlaybackRateChange = (rate: number) => {
        if (!videoRef.current) return;
        videoRef.current.playbackRate = rate;
        setPlaybackRate(rate);
        setIsPlaybackRateMenuOpen(false);
        setIsSettingsMenuOpen(false);
    };
    
    const handleVolumeMouseEnter = () => {
        if(volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        setIsVolumeSliderVisible(true);
    };

    const handleVolumeMouseLeave = () => {
        volumeTimeoutRef.current = setTimeout(() => {
            setIsVolumeSliderVisible(false);
        }, 1000);
    };

    // --- Efeitos e Listeners ---
    const resetInactivityTimeout = useCallback(() => {
        if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
        setAreControlsVisible(true);
        inactivityTimeoutRef.current = setTimeout(() => {
            if (videoRef.current && !videoRef.current.paused) {
                setAreControlsVisible(false);
                setIsSettingsMenuOpen(false);
                setIsPlaybackRateMenuOpen(false);
            }
        }, 3000);
    }, []);
    
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.src = src;
            if (thumbnailVideoRef.current) {
                thumbnailVideoRef.current.src = src;
            }
            video.play().catch(e => {
                console.log("A reprodução automática foi bloqueada.");
                setIsPlaying(false);
            });
        }
    }, [src]);

    useEffect(() => {
        const video = videoRef.current;
        const container = playerContainerRef.current;
        if (!video || !container) return;

        const updateState = () => {
            setIsPlaying(!video.paused);
            setIsMuted(video.muted);
            setVolume(video.volume);
            setCurrentTime(video.currentTime);
            setDuration(video.duration || 0);
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(video.buffered.length - 1));
            }
            if (video.currentTime >= 10 && !isLogoVisible) {
                setIsLogoVisible(true);
            }
        };

        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        
        video.addEventListener('timeupdate', updateState);
        video.addEventListener('loadedmetadata', updateState);
        video.addEventListener('play', updateState);
        video.addEventListener('pause', updateState);
        video.addEventListener('volumechange', updateState);
        video.addEventListener('progress', updateState);
        container.addEventListener('mousemove', resetInactivityTimeout);
        container.addEventListener('mouseleave', () => clearTimeout(inactivityTimeoutRef.current));
        document.addEventListener('fullscreenchange', onFullscreenChange);
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            switch(e.key.toLowerCase()) {
                case ' ': case 'k': e.preventDefault(); togglePlay(); break;
                case 'f': e.preventDefault(); toggleFullscreen(); break;
                case 'm': e.preventDefault(); toggleMute(); break;
                case 'arrowleft': e.preventDefault(); video.currentTime -= 5; break;
                case 'arrowright': e.preventDefault(); video.currentTime += 5; break;
            }
        };
        container.addEventListener('keydown', handleKeyDown);

        return () => {
            video.removeEventListener('timeupdate', updateState);
            video.removeEventListener('loadedmetadata', updateState);
            video.removeEventListener('play', updateState);
            video.removeEventListener('pause', updateState);
            video.removeEventListener('volumechange', updateState);
            video.removeEventListener('progress', updateState);
            container.removeEventListener('mousemove', resetInactivityTimeout);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            container.removeEventListener('keydown', handleKeyDown);
            if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
        };
    }, [togglePlay, toggleFullscreen, toggleMute, resetInactivityTimeout, isLogoVisible]);
    
     useEffect(() => {
        if (thumbnailState.visible && thumbnailVideoRef.current) {
            thumbnailVideoRef.current.currentTime = thumbnailState.time;
        }
    }, [thumbnailState]);

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
        const date = new Date(timeInSeconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes().toString().padStart(2, '0');
        const ss = date.getUTCSeconds().toString().padStart(2, '0');
        return hh > 0 ? `${hh}:${mm}:${ss}` : `${date.getUTCMinutes()}:${ss}`;
    };

    return (
        <div ref={playerContainerRef} className={`playerContainer ${!areControlsVisible ? 'hideCursor' : ''}`} tabIndex={0}>
            <PlayerStyles />
            <video ref={videoRef} className="videoElement" onClick={togglePlay} onDoubleClick={toggleFullscreen} autoPlay playsInline />
            <img src="https://i.ibb.co/s91tyczd/Gemini-Generated-Image-ejjiocejjiocejji-1.png" alt="Logo" className={`logoWatermark ${isLogoVisible ? 'visible' : ''}`} />

            {!isPlaying && (
                <div className="centerPlayOverlay" onClick={togglePlay}>
                    <svg className="centerPlayIcon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                </div>
            )}
            
            <div className={`controlsOverlay ${!areControlsVisible && !isPlaying ? 'visible' : ''} ${!areControlsVisible && isPlaying ? 'hidden' : ''}`}>
                 <div className="thumbnailContainer" style={{ left: `${thumbnailState.x}px`, display: thumbnailState.visible ? 'block' : 'none' }}>
                    <video ref={thumbnailVideoRef} className="thumbnailVideo" muted></video>
                    <span className="thumbnailTime">{formatTime(thumbnailState.time)}</span>
                </div>

                <div className="progressBarContainer" onMouseMove={handleProgressBarMove} onMouseLeave={() => setThumbnailState(s => ({...s, visible: false}))} onClick={handleProgressBarClick}>
                    <div className="progressTrack">
                        <div className="bufferedBar" style={{ width: `${(buffered / duration) * 100}%` }}></div>
                        <div className="progressBar" style={{ width: `${(currentTime / duration) * 100}%` }}>
                            <div className="progressThumb"></div>
                        </div>
                    </div>
                </div>

                <div className="bottomControls">
                    <div className="controlsGroup">
                        <button onClick={togglePlay} className="controlButton">
                             <img src={isPlaying ? "https://i.ibb.co/wryVJ2rQ/9.png" : "https://i.ibb.co/bMZvnxHW/1.png"} alt={isPlaying ? "Pause" : "Play"} width={32} height={32} className="controlIcon" />
                        </button>
                        <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }} className="controlButton">
                            <img src="https://i.ibb.co/HfBBdHzG/2.png" alt="Retroceder 10s" width={32} height={32} className="controlIcon" />
                        </button>
                         <div className="volumeContainer" onMouseEnter={handleVolumeMouseEnter} onMouseLeave={handleVolumeMouseLeave}>
                            <button onClick={toggleMute} className="controlButton">
                                <img src="https://i.ibb.co/B2kNS8fh/3.png" alt="Volume" width={32} height={32} className="controlIcon"/>
                            </button>
                            {isVolumeSliderVisible && (
                                <div className="volumeSliderWrapper">
                                    <div className="volumeSliderContainer" onClick={(e) => {
                                         const rect = e.currentTarget.getBoundingClientRect();
                                         const newVolume = (rect.bottom - e.clientY) / rect.height;
                                         handleVolumeChange(newVolume);
                                    }}>
                                        <div className="volumeSlider" style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}>
                                            <div className="volumeSliderThumb"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="timeDisplay">{formatTime(currentTime)} / {formatTime(duration)}</div>
                    </div>
                    
                    <div className="controlsGroup">
                        <button className="controlButton">
                            <img src="https://i.ibb.co/NgnKnFhK/6.png" alt="Chromecast" width={32} height={32} className="controlIcon"/>
                        </button>
                        <div className="settingsContainer">
                             <button onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)} className="controlButton">
                                <img src="https://i.ibb.co/BK56M1t3/4.png" alt="Configurações" width={32} height={32} className="controlIcon" style={{ transform: 'translateY(2px)' }}/>
                            </button>
                            {(isSettingsMenuOpen || isPlaybackRateMenuOpen) && (
                                <div className="settingsMenu" onMouseLeave={() => {setIsSettingsMenuOpen(false); setIsPlaybackRateMenuOpen(false);}}>
                                    {isPlaybackRateMenuOpen ? (
                                        <>
                                            <div onClick={() => setIsPlaybackRateMenuOpen(false)} className="settingsMenuItemHeader">&lt; Velocidade</div>
                                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                                <div key={rate} onClick={() => handlePlaybackRateChange(rate)} className={`settingsMenuItem ${playbackRate === rate ? 'active' : ''}`}>
                                                    {rate === 1 ? 'Normal' : `${rate}x`} {playbackRate === rate && '✓'}
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div onClick={() => setIsPlaybackRateMenuOpen(true)} className="settingsMenuItem">
                                            <span>Velocidade</span>
                                            <span className="settingsValue">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`} &gt;</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                         <button className="controlButton">
                           <img src="https://i.ibb.co/7xdm8dxy/7.png" alt="Chromecast" width={32} height={32} className="controlIcon"/>
                        </button>
                        <button onClick={toggleFullscreen} className="controlButton">
                             <img src={isFullscreen ? "https://i.ibb.co/yc3n5Mbs/8.png" : "https://i.ibb.co/pv1B47cV/5.png"} alt={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"} width={32} height={32} className="controlIcon"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CineVEOPlayer;

