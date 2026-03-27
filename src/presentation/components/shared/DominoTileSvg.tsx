import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Line,
  Path,
  Defs,
  Filter,
  G,
} from 'react-native-svg';
import { AppTheme } from '../../../core/theme/appTheme';

interface PipPosition {
  x: number;
  y: number;
}

function getPipPositions(
  cx: number,
  cy: number,
  offset: number,
  count: number
): PipPosition[] {
  const topLeft = { x: cx - offset, y: cy - offset };
  const topRight = { x: cx + offset, y: cy - offset };
  const midLeft = { x: cx - offset, y: cy };
  const center = { x: cx, y: cy };
  const midRight = { x: cx + offset, y: cy };
  const bottomLeft = { x: cx - offset, y: cy + offset };
  const bottomRight = { x: cx + offset, y: cy + offset };

  switch (count) {
    case 0:
      return [];
    case 1:
      return [center];
    case 2:
      return [topRight, bottomLeft];
    case 3:
      return [topRight, center, bottomLeft];
    case 4:
      return [topLeft, topRight, bottomLeft, bottomRight];
    case 5:
      return [topLeft, topRight, center, bottomLeft, bottomRight];
    case 6:
      return [topLeft, topRight, midLeft, midRight, bottomLeft, bottomRight];
    default:
      return [];
  }
}

interface DominoTileSvgProps {
  leftPips: number;
  rightPips: number;
  isHorizontal?: boolean;
  isFaceDown?: boolean;
  isSelected?: boolean;
  isDimmed?: boolean;
  tileWidth?: number;
  onPress?: () => void;
}

export const DominoTileSvg: React.FC<DominoTileSvgProps> = ({
  leftPips,
  rightPips,
  isHorizontal = true,
  isFaceDown = false,
  isSelected = false,
  isDimmed = false,
  tileWidth = 40,
  onPress,
}) => {
  const tileHeight = tileWidth * 2;
  const cornerRadius = tileWidth * 0.12;
  const pipRadius = tileWidth * 0.08;
  const padding = tileWidth * 0.15;

  // Dimensions for the SVG viewport
  const svgWidth = isHorizontal ? tileHeight : tileWidth;
  const svgHeight = isHorizontal ? tileWidth : tileHeight;

  // Tile rect
  const rectX = 0;
  const rectY = 0;
  const rectW = svgWidth;
  const rectH = svgHeight;

  const bgColor = isFaceDown ? AppTheme.faceDownColor : AppTheme.tileColor;
  const borderColor = isFaceDown
    ? AppTheme.faceDownBorderColor
    : AppTheme.tileBorderColor;

  const renderPips = (
    cx: number,
    cy: number,
    halfSize: number,
    count: number
  ) => {
    const s = halfSize;
    const offset = s * 0.25;
    const positions = getPipPositions(cx, cy, offset, count);

    return positions.map((pos, i) => (
      <G key={i}>
        <Circle
          cx={pos.x}
          cy={pos.y}
          r={pipRadius}
          fill={AppTheme.pipColor}
        />
        <Circle
          cx={pos.x - pipRadius * 0.2}
          cy={pos.y - pipRadius * 0.2}
          r={pipRadius * 0.3}
          fill={AppTheme.pipHighlightColor}
        />
      </G>
    ));
  };

  const renderFaceDownPattern = () => {
    const centerX = rectW / 2;
    const centerY = rectH / 2;
    const diamondSize = Math.min(rectW, rectH) * 0.25;

    const d = `M ${centerX} ${centerY - diamondSize} L ${centerX + diamondSize} ${centerY} L ${centerX} ${centerY + diamondSize} L ${centerX - diamondSize} ${centerY} Z`;

    return (
      <>
        <Path d={d} fill={AppTheme.faceDownPatternColor} />
        <Path
          d={d}
          fill="none"
          stroke={AppTheme.faceDownPatternBorderColor}
          strokeWidth={1}
        />
      </>
    );
  };

  const renderContent = () => {
    if (isFaceDown) {
      return renderFaceDownPattern();
    }

    if (isHorizontal) {
      const midX = rectW / 2;
      const leftCx = midX / 2;
      const leftCy = rectH / 2;
      const rightCx = midX + midX / 2;
      const rightCy = rectH / 2;
      const halfSize = Math.min(midX, rectH);

      return (
        <>
          {/* Dividing line */}
          <Line
            x1={midX}
            y1={padding}
            x2={midX}
            y2={rectH - padding}
            stroke={AppTheme.tileBorderColor}
            strokeWidth={1.5}
          />
          {/* Left pips */}
          {renderPips(leftCx, leftCy, halfSize, leftPips)}
          {/* Right pips */}
          {renderPips(rightCx, rightCy, halfSize, rightPips)}
        </>
      );
    } else {
      const midY = rectH / 2;
      const topCx = rectW / 2;
      const topCy = midY / 2;
      const bottomCx = rectW / 2;
      const bottomCy = midY + midY / 2;
      const halfSize = Math.min(rectW, midY);

      return (
        <>
          {/* Dividing line */}
          <Line
            x1={padding}
            y1={midY}
            x2={rectW - padding}
            y2={midY}
            stroke={AppTheme.tileBorderColor}
            strokeWidth={1.5}
          />
          {/* Top pips (left value) */}
          {renderPips(topCx, topCy, halfSize, leftPips)}
          {/* Bottom pips (right value) */}
          {renderPips(bottomCx, bottomCy, halfSize, rightPips)}
        </>
      );
    }
  };

  const svgContent = (
    <View
      style={{
        opacity: isDimmed ? 0.4 : 1.0,
        width: svgWidth + 4,
        height: svgHeight + 6,
      }}
    >
      <Svg width={svgWidth + 4} height={svgHeight + 6} viewBox={`-2 -3 ${svgWidth + 4} ${svgHeight + 6}`}>
        {/* Shadow */}
        <Rect
          x={2}
          y={3}
          width={rectW}
          height={rectH}
          rx={cornerRadius}
          ry={cornerRadius}
          fill="rgba(0,0,0,0.25)"
        />
        {/* Selected glow */}
        {isSelected && (
          <Rect
            x={-4}
            y={-4}
            width={rectW + 8}
            height={rectH + 8}
            rx={cornerRadius + 4}
            ry={cornerRadius + 4}
            fill="none"
            stroke={AppTheme.tileSelected}
            strokeWidth={3}
            opacity={0.6}
          />
        )}
        {/* Tile background */}
        <Rect
          x={rectX}
          y={rectY}
          width={rectW}
          height={rectH}
          rx={cornerRadius}
          ry={cornerRadius}
          fill={bgColor}
        />
        {/* Border */}
        <Rect
          x={rectX}
          y={rectY}
          width={rectW}
          height={rectH}
          rx={cornerRadius}
          ry={cornerRadius}
          fill="none"
          stroke={borderColor}
          strokeWidth={1.5}
        />
        {/* Content */}
        {renderContent()}
      </Svg>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {svgContent}
      </TouchableOpacity>
    );
  }

  return svgContent;
};
