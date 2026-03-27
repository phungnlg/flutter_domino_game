import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { DominoTile, canPlayOn } from '../../../data/models/dominoTile';
import { BoardTile } from '../../../data/models/gameState';
import { AppTheme } from '../../../core/theme/appTheme';
import { DominoTileSvg } from '../shared/DominoTileSvg';

interface BoardWidgetProps {
  boardTiles: BoardTile[];
  openLeft: number;
  openRight: number;
  isMyTurn: boolean;
  selectedTile: DominoTile | null;
  onEndTap?: (end: string) => void;
}

export const BoardWidget: React.FC<BoardWidgetProps> = ({
  boardTiles,
  openLeft,
  openRight,
  isMyTurn,
  selectedTile,
  onEndTap,
}) => {
  const canPlayOnLeft = (): boolean => {
    if (!selectedTile || openLeft === -1) return false;
    return canPlayOn(selectedTile, openLeft);
  };

  const canPlayOnRight = (): boolean => {
    if (!selectedTile || openRight === -1) return false;
    return canPlayOn(selectedTile, openRight);
  };

  const renderEndIndicator = (end: string) => (
    <TouchableOpacity
      key={`end-${end}`}
      onPress={() => onEndTap?.(end)}
      style={styles.endIndicator}
      activeOpacity={0.7}
    >
      <Text style={styles.endIndicatorText}>+</Text>
    </TouchableOpacity>
  );

  if (boardTiles.length === 0) {
    return (
      <View style={styles.emptyBoard}>
        <Text style={styles.emptyBoardText}>Play a tile to start</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.boardContainer}
      centerContent
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.boardInner}
        centerContent
      >
        <View style={styles.tileChain}>
          {/* Left end indicator */}
          {isMyTurn && selectedTile && canPlayOnLeft() && renderEndIndicator('left')}

          {/* Board tiles */}
          {boardTiles.map((tileData, index) => {
            const { tile, flipped } = tileData;
            const displayLeft = flipped ? tile.right : tile.left;
            const displayRight = flipped ? tile.left : tile.right;
            const isLastPlaced = index === boardTiles.length - 1;

            if (isLastPlaced) {
              return (
                <Animated.View
                  key={index}
                  entering={ZoomIn.duration(400).springify()}
                  style={styles.tileMargin}
                >
                  <DominoTileSvg
                    leftPips={displayLeft}
                    rightPips={displayRight}
                    isHorizontal={true}
                    tileWidth={30}
                  />
                </Animated.View>
              );
            }

            return (
              <View key={index} style={styles.tileMargin}>
                <DominoTileSvg
                  leftPips={displayLeft}
                  rightPips={displayRight}
                  isHorizontal={true}
                  tileWidth={30}
                />
              </View>
            );
          })}

          {/* Right end indicator */}
          {isMyTurn && selectedTile && canPlayOnRight() && renderEndIndicator('right')}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  emptyBoard: {
    width: 200,
    height: 100,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 74, 28, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  emptyBoardText: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 14,
  },
  boardContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  boardInner: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileChain: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileMargin: {
    margin: 1,
  },
  endIndicator: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 214, 0, 0.2)',
    borderWidth: 2,
    borderColor: AppTheme.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endIndicatorText: {
    color: AppTheme.secondary,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
