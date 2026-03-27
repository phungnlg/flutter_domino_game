import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { AppTheme } from '../../src/core/theme/appTheme';
import { useGameStore } from '../../src/store/gameStore';
import { HapticService } from '../../src/core/services/hapticService';
import { isBlocked } from '../../src/data/models/gameState';
import { hasEmptyHand, handPipCount } from '../../src/data/models/player';
import { ScoreBoard } from '../../src/presentation/components/shared/ScoreCounter';

export default function ResultsScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();

  const {
    gameState,
    currentPlayer,
    players,
    setGameState,
    setCurrentRoom,
    setCurrentPlayer,
    setPlayers,
    setSelectedTileIndex,
  } = useGameStore();

  const teamAScore = gameState?.scores['teamA'] ?? 0;
  const teamBScore = gameState?.scores['teamB'] ?? 0;

  const isMyTeamWinner = (): boolean => {
    if (!gameState || !currentPlayer) return false;
    return (
      (currentPlayer.team === 0 && teamAScore > teamBScore) ||
      (currentPlayer.team === 1 && teamBScore > teamAScore)
    );
  };

  const getWinnerText = (): string => {
    if (!gameState) return 'Game Over';
    if (teamAScore > teamBScore) return 'Team A Wins!';
    if (teamBScore > teamAScore) return 'Team B Wins!';
    return "It's a Tie!";
  };

  const getWinnerColor = (): string => {
    if (!gameState) return AppTheme.secondary;
    if (teamAScore > teamBScore) return AppTheme.teamAColor;
    if (teamBScore > teamAScore) return AppTheme.teamBColor;
    return AppTheme.secondary;
  };

  useEffect(() => {
    if (isMyTeamWinner()) {
      HapticService.win();
    }
  }, []);

  const handlePlayAgain = () => {
    setGameState(null);
    setSelectedTileIndex(null);
    router.replace('/');
  };

  const handleBackToLobby = () => {
    setGameState(null);
    setCurrentRoom(null);
    setCurrentPlayer(null);
    setPlayers([]);
    setSelectedTileIndex(null);
    router.replace('/');
  };

  const winnerColor = getWinnerColor();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        {/* Trophy/result icon */}
        <Animated.View entering={ZoomIn.duration(600).springify()}>
          <Text style={[styles.trophyIcon, { color: winnerColor }]}>
            {isMyTeamWinner() ? '🏆' : '🎯'}
          </Text>
        </Animated.View>

        {/* Winner text */}
        <Animated.Text
          entering={FadeIn.delay(300).duration(500)}
          style={[styles.winnerText, { color: winnerColor }]}
        >
          {getWinnerText()}
        </Animated.Text>

        {/* Blocked indicator */}
        {gameState && isBlocked(gameState) && (
          <Text style={styles.blockedText}>
            Game blocked - all players passed
          </Text>
        )}

        {/* Round */}
        <Text style={styles.roundText}>Round {gameState?.round ?? 1}</Text>

        {/* Score display */}
        {gameState && (
          <Animated.View
            entering={FadeIn.delay(600).duration(500)}
            style={styles.scoreContainer}
          >
            <ScoreBoard scores={gameState.scores} />
          </Animated.View>
        )}

        {/* Player breakdown */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Player Summary</Text>
          {players.map((player, index) => {
            const teamColor =
              player.team === 0 ? AppTheme.teamAColor : AppTheme.teamBColor;
            const remainingPips = handPipCount(player);
            const isEmpty = hasEmptyHand(player);

            return (
              <Animated.View
                key={player.id}
                entering={FadeIn.delay(800 + index * 100)}
                style={styles.playerSummaryRow}
              >
                <View
                  style={[
                    styles.playerSummaryDot,
                    { backgroundColor: teamColor },
                  ]}
                />
                <Text style={styles.playerSummaryName}>{player.name}</Text>
                <Text
                  style={[
                    styles.playerSummaryScore,
                    {
                      color: isEmpty
                        ? AppTheme.secondary
                        : 'rgba(255,255,255,0.54)',
                      fontWeight: isEmpty ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {isEmpty ? 'Domino!' : `${remainingPips} pips left`}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.spacer} />

        {/* Action buttons */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handlePlayAgain}
        >
          <Text style={styles.primaryButtonText}>🔄 Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlinedButton}
          onPress={handleBackToLobby}
        >
          <Text style={styles.outlinedButtonText}>Back to Lobby</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppTheme.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  trophyIcon: {
    fontSize: 80,
    textAlign: 'center',
    marginTop: 32,
  },
  winnerText: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 16,
  },
  blockedText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  roundText: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  scoreContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  summaryContainer: {
    backgroundColor: AppTheme.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 32,
  },
  summaryTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  playerSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerSummaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  playerSummaryName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  playerSummaryScore: {
    fontSize: 12,
  },
  spacer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: AppTheme.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: AppTheme.onSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  outlinedButton: {
    borderWidth: 1,
    borderColor: AppTheme.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  outlinedButtonText: {
    color: AppTheme.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
