import { useState, useRef, useEffect } from "react";

export function useYouTubePlayer(videoId, offset) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const isSeekingRef = useRef(false);

  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const actualTime = playerRef.current.getCurrentTime();
        const adjustedTime = Math.max(0, actualTime - offset);
        setCurrentTime(adjustedTime);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (videoId && window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '1',
          width: '1',
          videoId: videoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event) => {
              setDuration(event.target.getDuration() - offset);
              setCurrentTime(0);
              event.target.cueVideoById({
                videoId: videoId,
                startSeconds: offset
              });
            },
            onStateChange: (event) => {
              const playing = event.data === window.YT.PlayerState.PLAYING;
              const buffering = event.data === window.YT.PlayerState.BUFFERING;

              if (!isSeekingRef.current || playing) {
                setIsPlaying(playing);
              }

              setIsBuffering(buffering && !isSeekingRef.current);

              if (playing) {
                isSeekingRef.current = false;
                startProgressTracking();
              } else if (!isSeekingRef.current) {
                stopProgressTracking();
              }
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopProgressTracking();
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, offset]);

  const togglePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleStop = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
      playerRef.current.seekTo(offset, true);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handlePositionChange = (e) => {
    const newTime = parseFloat(e.target.value);
    isSeekingRef.current = true;
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime + offset, true);
    }
  };

  const seekToTime = (time) => {
    if (playerRef.current) {
      const playerState = playerRef.current.getPlayerState();

      if (playerState === -1 || playerState === 0 || playerState === 5) {
        playerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: time + offset
        });
      } else {
        playerRef.current.seekTo(time + offset, true);
        if (playerState === 2) {
          playerRef.current.playVideo();
        }
      }
      setCurrentTime(time);
    }
  };

  const skipBackward = () => {
    if (playerRef.current) {
      isSeekingRef.current = true;
      const newTime = Math.max(0, currentTime - 5);
      playerRef.current.seekTo(newTime + offset, true);
      setCurrentTime(newTime);
    }
  };

  const skipForward = () => {
    if (playerRef.current) {
      isSeekingRef.current = true;
      const newTime = Math.min(duration, currentTime + 5);
      playerRef.current.seekTo(newTime + offset, true);
      setCurrentTime(newTime);
    }
  };

  return {
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    playerRef,
    togglePlayPause,
    handleStop,
    handlePositionChange,
    seekToTime,
    skipBackward,
    skipForward,
  };
}
