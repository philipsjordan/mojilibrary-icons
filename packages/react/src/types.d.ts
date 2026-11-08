import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Width and height in pixels. Default 24. */
  size?: number | string;
  /** Stroke width. Default 2. */
  strokeWidth?: number | string;
  /** Stroke colour. Default currentColor, so the icon takes the text colour. */
  color?: string;
  /** Adds an accessible name (a <title>) and makes the icon an image for screen readers. */
  title?: string;
}

export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
