import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface SpeechAnimationProps {
  isPlaying: boolean;
  size?: number;
  isVisible?: boolean;
}

export function SpeechAnimation({ isPlaying, size = 320, isVisible = true }: SpeechAnimationProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current?.play();
    } else {
      animationRef.current?.reset();
    }
  }, [isPlaying]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        ref={animationRef}
        source={require('../assets/lotties/ai-speech-animation.json')}
        autoPlay={isPlaying}
        loop
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
