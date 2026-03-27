import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AppTheme } from '../../../core/theme/appTheme';
import { DominoTileSvg } from '../shared/DominoTileSvg';

export type OpponentPosition = 'top' | 'left' | 'right';

interface OpponentHandWidgetProps {
  playerName: string;
  tileCount: number;
  team: number;
  isCurrentTurn?: boolean;
  position?: OpponentPosition;
}

export const OpponentHandWidget: React.FC<OpponentHandWidgetProps> = ({
  playerName,
  tileCount,
  team,
  isCurrentTurn = false,
  position = 'top',
}) => {
  const teamColor = team === 0 ? AppTheme.teamAColor : AppTheme.teamBColor;

  const isVerticalLayout = position === 'left' || position === 'right';

  const renderTiles = () => {
    if (isVerticalLayout) {
      return (
        <ScrollView style={{ maxHeight: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.verticalTiles}>
            {Array.from({ length: tileCount }).map((_, i) => (
              <View key={i} style={styles.verticalTileMargin}>
                <DominoTileSvg
                  leftPips={0}
                  rightPips={0}
                  isHorizontal={true}
                  isFaceDown={true}
                  tileWidth={16}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    // Top position - horizontal fan
    return (
      <View style={styles.horizontalTiles}>
        {Array.from({ length: tileCount }).map((_, i) => (
          <View key={i} style={styles.horizontalTileMargin}>
            <DominoTileSvg
              leftPips={0}
              rightPips={0}
              isHorizontal={false}
              isFaceDown={true}
              tileWidth={20}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isCurrentTurn && styles.currentTurnContainer,
        isCurrentTurn && {
          borderColor: 'rgba(255, 214, 0, 0.4)',
        },
      ]}
    >
      {/* Player name and team indicator */}
      <View style={styles.nameRow}>
        <View style={[styles.teamDot, { backgroundColor: teamColor }]} />
        <Text
          style={[
            styles.playerName,
            {
              color: isCurrentTurn
                ? AppTheme.secondary
                : 'rgba(255,255,255,0.7)',
              fontWeight: isCurrentTurn ? 'bold' : 'normal',
            },
          ]}
        >
          {playerName}
        </Text>
      </View>

      {/* Face-down tiles */}
      {renderTiles()}

      <Text style={styles.tileCountText}>{tileCount} tiles</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentTurnContainer: {
    backgroundColor: 'rgba(255, 214, 0, 0.1)',
    borderWidth: 1.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  playerName: {
    fontSize: 12,
  },
  verticalTiles: {
    alignItems: 'center',
  },
  verticalTileMargin: {
    marginVertical: 1,
  },
  horizontalTiles: {
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
  },
  horizontalTileMargin: {
    marginHorizontal: 1,
  },
  tileCountText: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 10,
    marginTop: 4,
  },
});
