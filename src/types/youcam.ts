export interface YouCamConcern {
  type: string;
  uiScore: number;
  rawScore: number;
  maskUrls: string[];
}

export interface YouCamSkinType {
  type: 'Normal' | 'Oily' | 'Dry' | 'Combination';
  region: 'whole' | 't_zone' | 'u_zone';
}

export interface YouCamScanResult {
  output: YouCamOutputItem[];
}

export interface YouCamOutputItem {
  type: string;
  ui_score?: number;
  raw_score?: number;
  score?: number;
  mask_urls?: string[];
  skin_type?: string;
  region?: string;
  url?: string;
}