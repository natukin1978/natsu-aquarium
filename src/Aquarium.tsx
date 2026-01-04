import { Stage, Sprite, Container } from '@pixi/react';
import { useEffect, useState } from 'react';

interface AquariumProps {
  width: number;
  height: number;
}

export const Aquarium = ({ width, height }: AquariumProps) => {
  // ここに魚のデータ（座標など）を保持するステートを作成していく
  return (
    <Stage width={width} height={height} options={{ backgroundColor: 0x006699, antialias: true }}>
      <Container>
        {/* ここに魚のコンポーネントを配置していく */}
      </Container>
    </Stage>
  );
};
