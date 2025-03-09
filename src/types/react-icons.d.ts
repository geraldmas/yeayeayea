declare module 'react-icons/fa' {
  import { IconType } from 'react-icons';
  
  export const FaStar: IconType;
  export const FaHeart: IconType;
  export const FaMoneyBillWave: IconType;
  export const FaUser: IconType;
  export const FaTag: IconType;
  export const FaMapMarkerAlt: IconType;
  export const FaBolt: IconType;
  export const FaCalendarAlt: IconType;
}

declare module 'react-icons' {
  import { ComponentType, SVGAttributes } from 'react';
  
  export interface IconBaseProps extends SVGAttributes<SVGElement> {
    size?: string | number;
    color?: string;
    title?: string;
  }
  
  export type IconType = ComponentType<IconBaseProps>;
} 