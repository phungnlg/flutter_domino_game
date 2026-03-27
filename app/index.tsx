import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { AppTheme } from '../src/core/theme/appTheme';
import { useGameStore } from '../src/store/gameStore';
import { Room, isFull, canStart } from '../src/data/models/room';
import { Player } from '../src/data/models/player';

export default function LobbyScreen() {
  const router = useRouter();
  const [nameText, setNameText] = useState('');
  const [codeText, setCodeText] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  const {
    gameService,
    setCurrentRoom: storeSetRoom,
    setPlayerName,
    setCurrentPlayer,
    setPlayers,
    setGameState,
  } = useGameStore();

  const loadRooms = useCallback(async () => {
    try {
      const rooms = await gameService.listRooms();
      setAvailableRooms(rooms);
    } catch {
      // Silently handle - rooms list is optional
    }
  }, [gameService]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const showError = (message: string) => {
    Alert.alert('Error', message);
  };

  const createRoom = async () => {
    const name = nameText.trim();
    if (!name) {
      showError('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const room = await gameService.createAndJoinRoom(name);
      setRoomCode(room.code);
      setCurrentRoom(room);
      storeSetRoom(room);
      setPlayerName(name);

      const me = gameService.findCurrentPlayer(room.players);
      if (me) {
        setCurrentPlayer(me);
        setPlayers(room.players);
      }

      // Listen for room updates
      gameService.listenToRoom(room.id, (data) => {
        try {
          const players = data.players as any[] | undefined;
          if (players) {
            const parsedPlayers: Player[] = players.map((p: any) => ({
              id: p.id,
              name: p.name,
              team: p.team,
              seat: p.seat,
              hand: [],
              isBot: p.isBot ?? p.is_bot ?? false,
            }));
            const updatedRoom: Room = {
              ...room,
              players: parsedPlayers,
              status: data.status ?? room.status,
            };
            setCurrentRoom(updatedRoom);
            storeSetRoom(updatedRoom);
            setPlayers(parsedPlayers);
          }
        } catch {}
      });
    } catch (e: any) {
      showError(`Failed to create room: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (code?: string) => {
    const name = nameText.trim();
    if (!name) {
      showError('Please enter your name');
      return;
    }

    const roomCodeToUse = code ?? codeText.trim().toUpperCase();
    if (!roomCodeToUse) {
      showError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    try {
      const room = await gameService.joinExistingRoom(roomCodeToUse, name);
      setRoomCode(room.code);
      setCurrentRoom(room);
      storeSetRoom(room);
      setPlayerName(name);

      const me = gameService.findCurrentPlayer(room.players);
      if (me) {
        setCurrentPlayer(me);
        setPlayers(room.players);
      }

      gameService.listenToRoom(room.id, (data) => {
        try {
          const players = data.players as any[] | undefined;
          if (players) {
            const parsedPlayers: Player[] = players.map((p: any) => ({
              id: p.id,
              name: p.name,
              team: p.team,
              seat: p.seat,
              hand: [],
              isBot: p.isBot ?? p.is_bot ?? false,
            }));
            const updatedRoom: Room = {
              ...room,
              players: parsedPlayers,
              status: data.status ?? room.status,
            };
            setCurrentRoom(updatedRoom);
            storeSetRoom(updatedRoom);
            setPlayers(parsedPlayers);
          }
        } catch {}
      });
    } catch (e: any) {
      showError(`Failed to join room: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fillWithAI = async () => {
    if (!currentRoom) return;
    setIsLoading(true);
    try {
      const players = await gameService.addBots(currentRoom.id);
      const updatedRoom: Room = { ...currentRoom, players };
      setCurrentRoom(updatedRoom);
      storeSetRoom(updatedRoom);
      setPlayers(players);
    } catch (e: any) {
      showError(`Failed to add AI players: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = async () => {
    if (!currentRoom) return;
    setIsLoading(true);
    try {
      await gameService.startGame(currentRoom.id);
      const currentPlayer = useGameStore.getState().currentPlayer;
      if (currentPlayer) {
        const fullState = await gameService.getGameState(
          currentRoom.id,
          currentPlayer.id
        );
        setGameState(fullState);

        const hand = gameService.lastPlayerHand;
        if (hand && hand.length > 0) {
          setCurrentPlayer({ ...currentPlayer, hand });
        }
        const allPlayers = gameService.lastPlayers;
        if (allPlayers) {
          setPlayers(allPlayers);
        }
      }

      router.push(`/game/${currentRoom.id}`);
    } catch (e: any) {
      showError(`Failed to start game: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPlayAI = async () => {
    const name = nameText.trim();
    if (!name) {
      showError('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      // Create room
      const room = await gameService.createAndJoinRoom(name);
      storeSetRoom(room);
      setPlayerName(name);

      // Set current player
      const me = gameService.findCurrentPlayer(room.players);
      if (me) {
        setCurrentPlayer(me);
      }

      // Add bots
      const players = await gameService.addBots(room.id);
      const fullRoom: Room = { ...room, players };
      storeSetRoom(fullRoom);
      setPlayers(players);

      // Start game
      await gameService.startGame(room.id);

      // Get full game state with player's hand
      const currentPlayer = useGameStore.getState().currentPlayer;
      if (currentPlayer) {
        const fullState = await gameService.getGameState(
          room.id,
          currentPlayer.id
        );
        setGameState(fullState);

        const hand = gameService.lastPlayerHand;
        if (hand && hand.length > 0) {
          setCurrentPlayer({ ...currentPlayer, hand });
        }
        const allPlayers = gameService.lastPlayers;
        if (allPlayers) {
          setPlayers(allPlayers);
        }
      }

      router.push(`/game/${room.id}`);
    } catch (e: any) {
      showError(`Failed to start AI game: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoomCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert('Copied', 'Room code copied!');
    } catch {
      // Clipboard not available
    }
  };

  // -- RENDER --

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Animated.Text
        entering={FadeIn.duration(600)}
        style={styles.titleSubtext}
      >
        Caribbean
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.duration(800).delay(200)}
        style={styles.titleText}
      >
        DOMINO
      </Animated.Text>
      <View style={styles.titleUnderline} />
    </View>
  );

  const renderRoomCard = (room: Room) => (
    <View key={room.id} style={styles.roomCard}>
      <View style={styles.roomCardLeft}>
        <View style={styles.roomAvatar}>
          <Text style={styles.roomAvatarText}>
            {room.players.length}/4
          </Text>
        </View>
        <View style={styles.roomCardInfo}>
          <Text style={styles.roomCardTitle}>Room {room.code}</Text>
          <Text style={styles.roomCardSubtitle}>
            {room.players.map((p) => p.name).join(', ')}
          </Text>
        </View>
      </View>
      {isFull(room) ? (
        <View style={styles.fullChip}>
          <Text style={styles.fullChipText}>Full</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.joinSmallButton}
          onPress={() => joinRoom(room.code)}
        >
          <Text style={styles.joinSmallButtonText}>Join</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLobbyView = () => (
    <View>
      {/* Name input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputIcon}>👤</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Your Name"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={nameText}
          onChangeText={setNameText}
          autoCapitalize="words"
        />
      </View>

      {/* Create Room button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={createRoom}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={AppTheme.onSecondary} />
        ) : (
          <Text style={styles.primaryButtonText}>Create Room</Text>
        )}
      </TouchableOpacity>

      {/* Quick Play vs AI */}
      <TouchableOpacity
        style={styles.outlinedButton}
        onPress={quickPlayAI}
        disabled={isLoading}
      >
        <Text style={styles.outlinedButtonText}>🤖 Quick Play vs AI</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Join Room */}
      <View style={styles.joinRow}>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.inputIcon}>🔑</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Room Code"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={codeText}
            onChangeText={(t) => setCodeText(t.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>
        <TouchableOpacity
          style={[styles.outlinedButton, { marginLeft: 12, marginTop: 0, paddingHorizontal: 20 }]}
          onPress={() => joinRoom()}
          disabled={isLoading}
        >
          <Text style={styles.outlinedButtonText}>Join</Text>
        </TouchableOpacity>
      </View>

      {/* Available rooms */}
      {availableRooms.length > 0 && (
        <View style={styles.roomsSection}>
          <View style={styles.roomsHeader}>
            <Text style={styles.roomsSectionTitle}>Available Rooms</Text>
            <TouchableOpacity onPress={loadRooms}>
              <Text style={styles.refreshText}>↻</Text>
            </TouchableOpacity>
          </View>
          {availableRooms.map(renderRoomCard)}
        </View>
      )}
    </View>
  );

  const renderRoomView = () => {
    if (!currentRoom) return null;

    const roomIsFull = isFull(currentRoom);
    const roomCanStart = canStart(currentRoom);

    return (
      <View>
        {/* Room code display */}
        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>Room Code</Text>
          <View style={styles.roomCodeRow}>
            <Text style={styles.roomCodeText}>{currentRoom.code}</Text>
            <TouchableOpacity onPress={() => copyRoomCode(currentRoom.code)}>
              <Text style={styles.copyIcon}>📋</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.roomCodeHint}>
            Share this code with other players
          </Text>
        </View>

        {/* Players list */}
        <Text style={styles.playersTitle}>Players</Text>
        {currentRoom.players.map((player, index) => {
          const teamColor =
            player.team === 1 ? AppTheme.teamAColor : AppTheme.teamBColor;
          return (
            <Animated.View
              key={player.id}
              entering={FadeIn.delay(index * 100)}
              style={[
                styles.playerRow,
                { borderColor: teamColor + '4D' },
              ]}
            >
              <View
                style={[styles.playerDot, { backgroundColor: teamColor }]}
              />
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={[styles.playerTeam, { color: teamColor }]}>
                {player.team === 1 ? 'Team A' : 'Team B'}
              </Text>
              <Text style={styles.playerSeat}>
                Seat {player.seat + 1}
              </Text>
            </Animated.View>
          );
        })}

        {/* Waiting slots */}
        {!roomIsFull &&
          Array.from({ length: 4 - currentRoom.players.length }).map(
            (_, i) => (
              <View key={`empty-${i}`} style={styles.emptyPlayerRow}>
                <View style={styles.emptyPlayerDot} />
                <Text style={styles.emptyPlayerText}>
                  Waiting for player...
                </Text>
              </View>
            )
          )}

        {/* Waiting indicator */}
        {!roomIsFull && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={AppTheme.secondary} />
            <Text style={styles.waitingText}>
              Waiting for {4 - currentRoom.players.length} more player(s)...
            </Text>
          </View>
        )}

        {/* Fill with AI button */}
        {!roomIsFull && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#2E7D32' }]}
            onPress={fillWithAI}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>🤖 Fill with AI</Text>
          </TouchableOpacity>
        )}

        {/* Start Game button */}
        {roomCanStart && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startGame}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={AppTheme.onSecondary}
              />
            ) : (
              <Text style={styles.primaryButtonText}>▶ Start Game</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Back button */}
        <TouchableOpacity
          style={[styles.outlinedButton, { marginTop: 12 }]}
          onPress={() => {
            setRoomCode(null);
            setCurrentRoom(null);
            storeSetRoom(null);
          }}
        >
          <Text style={styles.outlinedButtonText}>Back to Lobby</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTitle()}
        {roomCode ? renderRoomView() : renderLobbyView()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppTheme.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  titleSubtext: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 8,
  },
  titleText: {
    fontSize: 48,
    fontWeight: '900',
    color: AppTheme.secondary,
    letterSpacing: 4,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: AppTheme.secondary,
    borderRadius: 2,
    marginTop: 8,
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppTheme.primary + '80',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 14,
  },
  // Buttons
  primaryButton: {
    backgroundColor: AppTheme.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: AppTheme.onSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  outlinedButton: {
    borderWidth: 1,
    borderColor: AppTheme.secondary + '80',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 12,
  },
  outlinedButtonText: {
    color: AppTheme.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginHorizontal: 16,
  },
  // Join row
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Available rooms
  roomsSection: {
    marginTop: 32,
  },
  roomsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomsSectionTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshText: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 22,
  },
  roomCard: {
    backgroundColor: AppTheme.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roomAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppTheme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  roomCardInfo: {
    flex: 1,
  },
  roomCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  roomCardSubtitle: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 12,
  },
  fullChip: {
    backgroundColor: AppTheme.error,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  fullChipText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  joinSmallButton: {
    borderWidth: 1,
    borderColor: AppTheme.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  joinSmallButtonText: {
    color: AppTheme.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Room view
  roomCodeContainer: {
    backgroundColor: AppTheme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppTheme.secondary + '4D',
    padding: 20,
    alignItems: 'center',
  },
  roomCodeLabel: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 14,
  },
  roomCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  roomCodeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: AppTheme.secondary,
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  copyIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  roomCodeHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
  },
  playersTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  playerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  playerName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  playerTeam: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  playerSeat: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
  },
  emptyPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  emptyPlayerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
  },
  emptyPlayerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
  },
  waitingContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  waitingText: {
    color: 'rgba(255,255,255,0.54)',
    marginTop: 8,
  },
});
