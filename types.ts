
export enum Orientation {
  VERTICAL = 'VERTICAL',
  HORIZONTAL = 'HORIZONTAL'
}

export enum ColorMode {
  BW = 'BW',
  GREEN = 'GREEN',
  RGB = 'RGB'
}

export interface CalibrationState {
  lpi: number;
  offset: number;
  thickness: number;
  orientation: Orientation;
  colorMode: ColorMode;
  basePpi: number;
  mediaUrl: string | null;
  mediaType: 'video' | 'image' | null;
  isPlaying: boolean;
  autoOrientation: boolean;
  precisionMode: boolean;
  videoRatio: 'auto' | '16:9' | '4:3' | '21:9' | '1:1';
}
