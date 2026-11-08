import type { DefineComponent } from 'vue';

export interface IconProps {
  /** Width and height in pixels. Default 24. */
  size?: number | string;
  /** Stroke width. Default 2. */
  strokeWidth?: number | string;
  /** Stroke colour. Default currentColor, so the icon takes the text colour. */
  color?: string;
  /** Adds an accessible name (a <title>) and makes the icon an image for screen readers. */
  title?: string;
}

export type Icon = DefineComponent<IconProps>;
