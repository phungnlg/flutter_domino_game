import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { DominoTile, canPlayOn } from '../../../data/models/dominoTile';
import { GameState } from '../../../data/models/gameState';
import { useGameStore } from '../../../store/gameStore';
import { DominoTileSvg } from '../shared/DominoTileSvg';

interface PlayerHandWidgetProps {
  tiles: DominoTile[];
  onTileTap: (index: number, tile: DominoTile) => void;
}

const AnimatedTile: React.FC<{
  tile: DominoTile;
  index: number;
  isSelected: boolean;
  isDimmed: boolean;
  isMyTurn: boolean;
  onTileTap: (index: number, tile: DominoTile) => void;
}> = ({ tile, index, isSelected, isDimmed, isMyTurn, onTileTap }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(isSelected ? -12 : 0, { duration: 200 }),
        },
      ],
    };
  }, [isSelected]);

  return (
    <Animated.View style={[styles.tileWrapper, animatedStyle]}>
      <DominoTileSvg
        leftPips={tile.left}
        rightPips={tile.right}
        isHorizontal={false}
        isSelected={isSelected}
        isDimmed={isDimmed}
        tileWidth={48}
        onPress={isMyTurn ? () => onTileTap(index, tile) : undefined}
      />
    </Animated.View>
  );
};

export const PlayerHandWidget: React.FC<PlayerHandWidgetProps> = ({
  tiles,
  onTileTap,
}) => {
  const selectedTileIndex = useGameStore((s) => s.selectedTileIndex);
  const gameState = useGameStore((s) => s.gameState);
  const isMyTurn = useGameStore((s) => s.isMyTurn)();

  const canPlayTile = (tile: DominoTile): boolean => {
    if (!gameState) return false;
    if (gameState.openLeft === -1 && gameState.openRight === -1) return true;
    return (
      canPlayOn(tile, gameState.openLeft) ||
      canPlayOn(tile, gameState.openRight)
    );
  };

  const borderColor = isMyTurn
    ? 'rgba(255, 214, 0, 0.5)'
    : 'rgba(255,255,255,0.12)';

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: borderColor,
          borderTopWidth: isMyTurn ? 2 : 1,
        },
      ]}
    >
      {tiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tiles remaining</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tiles.map((tile, index) => {
            const isSelected = selectedTileIndex === index;
            const canPlay = isMyTurn && canPlayTile(tile);
            const isDimmed = isMyTurn && !canPlay;

            return (
              <AnimatedTile
                key={`${tile.left}-${tile.right}-${index}`}
                tile={tile}
                index={index}
                isSelected={isSelected}
                isDimmed={isDimmed}
                isMyTurn={isMyTurn}
                onTileTap={onTileTap}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 140,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.26)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tileWrapper: {
    marginHorizontal: 4,
  },
});
