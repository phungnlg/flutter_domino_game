import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { AppTheme } from '../../../core/theme/appTheme';

interface TurnIndicatorProps {
  playerName: string;
  isActive?: boolean;
  color?: string;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  playerName,
  isActive = false,
  color,
}) => {
  const effectiveColor = color ?? AppTheme.secondary;
  const anim = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      anim.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cancelAnimation(anim);
      anim.value = 0;
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(anim.value, [0, 1], [1.0, 1.15]);
    const glowOpacity = interpolate(anim.value, [0, 1], [0.3, 0.8]);

    return {
      transform: [{ scale: isActive ? scale : 1 }],
      borderColor: isActive
        ? `rgba(255, 214, 0, ${glowOpacity})`
        : 'rgba(255,255,255,0.24)',
      borderWidth: isActive ? 2 : 1,
      backgroundColor: isActive
        ? `rgba(255, 214, 0, 0.2)`
        : 'transparent',
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        {isActive && (
          <View
            style={[styles.dot, { backgroundColor: effectiveColor }]}
          />
        )}
        <Text
          style={[
            styles.text,
            {
              color: isActive ? effectiveColor : 'rgba(255,255,255,0.7)',
              fontWeight: isActive ? 'bold' : 'normal',
            },
          ]}
        >
          {playerName}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
  },
});
