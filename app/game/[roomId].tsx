import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTheme } from '../../src/core/theme/appTheme';
import { useGameStore } from '../../src/store/gameStore';
import { HapticService } from '../../src/core/services/hapticService';
import { DominoTile, canPlayOn } from '../../src/data/models/dominoTile';
import { GameState, isGameOver, isRoundOver } from '../../src/data/models/gameState';
import { Player } from '../../src/data/models/player';
import { BoardWidget } from '../../src/presentation/components/game/BoardWidget';
import { PlayerHandWidget } from '../../src/presentation/components/game/PlayerHandWidget';
import {
  OpponentHandWidget,
  OpponentPosition,
} from '../../src/presentation/components/game/OpponentHandWidget';
import { ScoreBoard } from '../../src/presentation/components/shared/ScoreCounter';
import { TurnIndicator } from '../../src/presentation/components/shared/TurnIndicator';

export default function GameScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const initializedRef = useRef(false);
  const refreshingRef = useRef(false);

  const {
    gameService,
    gameState,
    currentPlayer,
    players,
    selectedTileIndex,
    isLoading: storeIsLoading,
    setGameState,
    setCurrentPlayer,
    setPlayers,
    setSelectedTileIndex,
    setIsLoading,
    setErrorMessage,
  } = useGameStore();

  const isMyTurn = useGameStore((s) => s.isMyTurn)();
  const canPassTurn = useGameStore((s) => s.canPass)();

  const refreshGameState = useCallback(async () => {
    if (!currentPlayer || !roomId) return;
    try {
      const refreshed = await gameService.getGameState(roomId, currentPlayer.id);
      setGameState(refreshed);

      const hand = gameService.lastPlayerHand;
      if (hand) {
        setCurrentPlayer({ ...currentPlayer, hand });
      }
      const allPlayers = gameService.lastPlayers;
      if (allPlayers) {
        setPlayers(allPlayers);
      }
    } catch (e) {
      console.log('Refresh state error:', e);
    }
  }, [currentPlayer, roomId, gameService, setGameState, setCurrentPlayer, setPlayers]);

  useEffect(() => {
    if (initializedRef.current || !currentPlayer || !roomId) return;
    initializedRef.current = true;

    // Subscribe to realtime updates
    gameService.listenToGameUpdates(roomId, () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      refreshGameState()
        .then(() => {
          refreshingRef.current = false;
          const gs = useGameStore.getState().gameState;
          if (gs && (isGameOver(gs) || isRoundOver(gs))) {
            router.replace(`/results/${roomId}`);
          }
          const me = useGameStore.getState().currentPlayer;
          if (gs && me && gs.currentPlayerId === me.id) {
            HapticService.yourTurn();
          }
        })
        .catch(() => {
          refreshingRef.current = false;
        });
    });

    // Fetch initial game state
    (async () => {
      try {
        const state = await gameService.getGameState(roomId, currentPlayer.id);
        setGameState(state);

        const hand = gameService.lastPlayerHand;
        if (hand && hand.length > 0) {
          setCurrentPlayer({ ...currentPlayer, hand });
        }
        const allPlayers = gameService.lastPlayers;
        if (allPlayers) {
          setPlayers(allPlayers);
        }
      } catch (e: any) {
        setErrorMessage(e.message);
      }
    })();
  }, [currentPlayer, roomId]);

  const playTile = async (tile: DominoTile, end: string) => {
    if (!currentPlayer || !roomId) return;

    setIsLoading(true);
    setSelectedTileIndex(null);

    try {
      await gameService.playTile(roomId, currentPlayer.id, tile, end);

      // Refresh full state (bots may have played)
      await refreshGameState();
      HapticService.tilePlaced();
      const gs = useGameStore.getState().gameState;
      if (gs && (isGameOver(gs) || isRoundOver(gs))) {
        router.replace(`/results/${roomId}`);
      }
    } catch (e: any) {
      HapticService.invalidMove();
      await refreshGameState();
      Alert.alert('Error', e.message?.replace('Error: ', '') ?? 'Failed to play tile');
    } finally {
      setIsLoading(false);
    }
  };

  const onTileTap = async (index: number, tile: DominoTile) => {
    if (!isMyTurn || !gameState || !currentPlayer) return;

    // If tapping the same tile, deselect
    if (selectedTileIndex === index) {
      setSelectedTileIndex(null);
      return;
    }

    // Select the tile
    setSelectedTileIndex(index);

    // If board is empty (first move), auto-play
    if (gameState.openLeft === -1 && gameState.openRight === -1) {
      await playTile(tile, 'right');
      return;
    }

    // Check which ends the tile can be played on
    const canLeft = canPlayOn(tile, gameState.openLeft);
    const canRight = canPlayOn(tile, gameState.openRight);

    // If only one valid end, auto-play
    if (canLeft && !canRight) {
      await playTile(tile, 'left');
    } else if (!canLeft && canRight) {
      await playTile(tile, 'right');
    }
    // If both ends valid, user taps end indicator on board
  };

  const onEndTap = async (end: string) => {
    if (selectedTileIndex === null || !currentPlayer) return;
    const tile = currentPlayer.hand[selectedTileIndex];
    await playTile(tile, end);
  };

  const handlePassTurn = async () => {
    if (!currentPlayer || !roomId) return;

    setIsLoading(true);
    try {
      const newState = await gameService.pass(roomId, currentPlayer.id);
      setGameState(newState);
      HapticService.passTurn();

      if (isGameOver(newState) || isRoundOver(newState)) {
        router.replace(`/results/${roomId}`);
      }
    } catch (e: any) {
      Alert.alert('Error', `Failed to pass: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getOpponentBySeat = (seatOffset: number): Player | null => {
    if (!currentPlayer || players.length === 0) return null;
    const targetSeat = (currentPlayer.seat + seatOffset) % 4;
    return players.find((p) => p.seat === targetSeat) ?? null;
  };

  const getCurrentPlayerName = (): string => {
    if (!gameState?.currentPlayerId) return 'Waiting';
    const found = players.find((p) => p.id === gameState.currentPlayerId);
    return found?.name ?? 'Opponent';
  };

  const opponentAcross = getOpponentBySeat(2);
  const opponentLeft = getOpponentBySeat(3);
  const opponentRight = getOpponentBySeat(1);

  let selectedTile: DominoTile | null = null;
  if (
    selectedTileIndex !== null &&
    currentPlayer &&
    selectedTileIndex < currentPlayer.hand.length
  ) {
    selectedTile = currentPlayer.hand[selectedTileIndex];
  }

  const handleLeave = () => {
    Alert.alert('Leave Game?', 'Are you sure you want to leave the game?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        onPress: () => router.replace('/'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLeave}>
          <Text style={styles.backButton}>{'←'}</Text>
        </TouchableOpacity>
        {gameState && <ScoreBoard scores={gameState.scores} />}
        <Text style={styles.roundText}>
          Round {gameState?.round ?? 1}
        </Text>
      </View>

      {/* Game area */}
      <View style={styles.gameArea}>
        {/* Board in center */}
        <View style={styles.boardArea}>
          <BoardWidget
            boardTiles={gameState?.board ?? []}
            openLeft={gameState?.openLeft ?? -1}
            openRight={gameState?.openRight ?? -1}
            isMyTurn={isMyTurn}
            selectedTile={selectedTile}
            onEndTap={onEndTap}
          />
        </View>

        {/* Opponent across (top) */}
        {opponentAcross && (
          <View style={styles.opponentTop}>
            <OpponentHandWidget
              playerName={opponentAcross.name}
              tileCount={opponentAcross.hand.length}
              team={opponentAcross.team}
              isCurrentTurn={
                gameState?.currentPlayerId === opponentAcross.id
              }
              position="top"
            />
          </View>
        )}

        {/* Opponent left */}
        {opponentLeft && (
          <View style={styles.opponentLeft}>
            <OpponentHandWidget
              playerName={opponentLeft.name}
              tileCount={opponentLeft.hand.length}
              team={opponentLeft.team}
              isCurrentTurn={
                gameState?.currentPlayerId === opponentLeft.id
              }
              position="left"
            />
          </View>
        )}

        {/* Opponent right */}
        {opponentRight && (
          <View style={styles.opponentRight}>
            <OpponentHandWidget
              playerName={opponentRight.name}
              tileCount={opponentRight.hand.length}
              team={opponentRight.team}
              isCurrentTurn={
                gameState?.currentPlayerId === opponentRight.id
              }
              position="right"
            />
          </View>
        )}

        {/* Turn indicator */}
        <View style={styles.turnIndicatorArea}>
          <View style={styles.turnIndicatorRow}>
            <TurnIndicator
              playerName={
                isMyTurn
                  ? 'Your Turn!'
                  : `${getCurrentPlayerName()}'s Turn`
              }
              isActive={isMyTurn}
            />
            {canPassTurn && (
              <TouchableOpacity
                style={styles.passButton}
                onPress={handlePassTurn}
                disabled={storeIsLoading}
              >
                <Text style={styles.passButtonText}>⏭ Pass</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Player hand at bottom */}
      <PlayerHandWidget
        tiles={currentPlayer?.hand ?? []}
        onTileTap={onTileTap}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppTheme.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: AppTheme.surface + 'CC',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  backButton: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 24,
    paddingHorizontal: 8,
  },
  roundText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  boardArea: {
    position: 'absolute',
    top: 0,
    left: 80,
    right: 80,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opponentTop: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  opponentLeft: {
    position: 'absolute',
    left: 4,
    top: 80,
    bottom: 80,
    justifyContent: 'center',
  },
  opponentRight: {
    position: 'absolute',
    right: 4,
    top: 80,
    bottom: 80,
    justifyContent: 'center',
  },
  turnIndicatorArea: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  turnIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: AppTheme.error,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  passButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
