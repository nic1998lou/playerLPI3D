
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
  videoUrl: string | null;
  isPlaying: boolean;
  autoOrientation: boolean;
}
