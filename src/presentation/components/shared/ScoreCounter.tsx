import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useDerivedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { AppTheme } from '../../../core/theme/appTheme';

interface ScoreCounterProps {
  teamName: string;
  score: number;
  teamColor: string;
  targetScore?: number;
}

const ScoreCounter: React.FC<ScoreCounterProps> = ({
  teamName,
  score,
  teamColor,
  targetScore = 100,
}) => {
  const animatedScore = useSharedValue(0);

  useEffect(() => {
    animatedScore.value = withTiming(score, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const progressWidth = Math.min((score / targetScore) * 60, 60);

  return (
    <View
      style={[
        styles.container,
        { borderColor: teamColor + '80' },
      ]}
    >
      <Text style={[styles.teamName, { color: teamColor }]}>{teamName}</Text>
      <Text style={styles.scoreText}>{score}</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBg} />
        <View
          style={[
            styles.progressFill,
            { width: progressWidth, backgroundColor: teamColor },
          ]}
        />
      </View>
    </View>
  );
};

interface ScoreBoardProps {
  scores: Record<string, number>;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ scores }) => {
  const teamAScore = scores['teamA'] ?? 0;
  const teamBScore = scores['teamB'] ?? 0;

  return (
    <View style={styles.boardContainer}>
      <ScoreCounter
        teamName="Team A"
        score={teamAScore}
        teamColor={AppTheme.teamAColor}
      />
      <Text style={styles.vsText}>vs</Text>
      <ScoreCounter
        teamName="Team B"
        score={teamBScore}
        teamColor={AppTheme.teamBColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: AppTheme.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppTheme.secondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  progressContainer: {
    width: 60,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBg: {
    position: 'absolute',
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  boardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginHorizontal: 8,
  },
});
