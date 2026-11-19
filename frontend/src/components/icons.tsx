// Custom icon set tuned for the design system. Strokes are 1.6-1.8 for a
// premium, editorial feel. Use <Icon.Foo size={n} /> or <Icon.Foo filled />.
import type { CSSProperties, ReactNode } from "react";

interface IconProps {
  size?: number;
  filled?: boolean;
  style?: CSSProperties;
  className?: string;
}

interface SvgProps extends IconProps {
  children: ReactNode;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

function Svg({
  size = 18,
  children,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 1.8,
  style,
  className,
}: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={style}
      className={className}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Search: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={2} {...rest}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  ),
  Bell: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
  ),
  Speaker: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.4 5.6a9 9 0 0 1 0 12.8" />
    </Svg>
  ),
  Mail: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Svg>
  ),
  Pin: ({ size = 14, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={2} {...rest}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  ),
  ChevDown: ({ size = 14, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={2} {...rest}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  ),
  ChevRight: ({ size = 14, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={2} {...rest}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  ),
  ChevLeft: ({ size = 14, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={2} {...rest}>
      <path d="m15 6-6 6 6 6" />
    </Svg>
  ),
  Star: ({ size = 14, filled = true, ...rest }: IconProps = {}) => (
    <Svg
      size={size}
      strokeWidth={1.5}
      fill={filled ? "currentColor" : "none"}
      {...rest}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Svg>
  ),
  Heart: ({ size = 18, filled = false, ...rest }: IconProps = {}) => (
    <Svg size={size} fill={filled ? "currentColor" : "none"} {...rest}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </Svg>
  ),
  Home: ({ size = 22, filled = false, ...rest }: IconProps = {}) => (
    <Svg size={size} fill={filled ? "currentColor" : "none"} {...rest}>
      <path d="M3 9.5 12 3l9 6.5V20a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2V9.5Z" />
    </Svg>
  ),
  Box: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </Svg>
  ),
  User: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </Svg>
  ),
  Plus: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={2} {...rest}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  ),
  Clock: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </Svg>
  ),
  Calendar: ({ size = 20, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18" />
      <path d="M8 2.5v4M16 2.5v4" />
    </Svg>
  ),
  Send: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </Svg>
  ),
  Check: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={2.5} {...rest}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  ),
  Tag: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </Svg>
  ),
  Sparkle: ({ size = 14, style, className }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      style={style}
      className={className}
    >
      <path d="m12 2 1.8 5.5L19 9.3l-5.2 1.8L12 16.5l-1.8-5.4L5 9.3l5.2-1.8L12 2Zm6.5 11 .9 2.7L22 16.5l-2.6.9-.9 2.6-.9-2.6L15 16.5l2.6-.9.9-2.7Z" />
    </svg>
  ),
  Filter: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M3 6h18M6 12h12M10 18h4" />
    </Svg>
  ),
  Crown: ({ size = 16, style, className }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      style={style}
      className={className}
    >
      <path d="M3 7l4 5 5-7 5 7 4-5v11H3V7Z" />
    </svg>
  ),
  Award: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <circle cx="12" cy="9" r="6" />
      <path d="m9 14.5-1.5 7L12 19l4.5 2.5L15 14.5" />
      <path d="m9.5 9 1.7 1.7L15 7" />
    </Svg>
  ),
  QrCode: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v7M17 21h4M14 21h.01" />
    </Svg>
  ),
  Building: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
      <path d="M11 21v-3h2v3" />
    </Svg>
  ),
  ExternalLink: ({ size = 14, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={2} {...rest}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M21 13v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7" />
    </Svg>
  ),
  Cart: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M3 6h2.5l1.6 11.2a2 2 0 0 0 2 1.8h8.3a2 2 0 0 0 2-1.6L21 9H6" />
      <circle cx="9" cy="22" r="1.4" />
      <circle cx="18" cy="22" r="1.4" />
    </Svg>
  ),
  Share: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </Svg>
  ),
  // ===== Categorias =====
  CatHighlight: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="m12 2 3 7 7 .8-5.4 4.7L18 22l-6-3.6L6 22l1.4-7.5L2 9.8 9 9l3-7Z" />
    </Svg>
  ),
  CatShopping: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="M3 6h2.5l1.6 11.2a2 2 0 0 0 2 1.8h8.3a2 2 0 0 0 2-1.6L21 9H6" />
      <circle cx="9" cy="22" r="1.4" />
      <circle cx="18" cy="22" r="1.4" />
      <path d="M9 6V4a3 3 0 0 1 6 0v2" />
    </Svg>
  ),
  CatPartners: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="M11 7 7.5 9.5 4 7l3.5-3L11 7Z" />
      <path d="M20 7 16.5 9.5 13 7l3.5-3L20 7Z" />
      <path d="M6 12v7l6 2 6-2v-7" />
      <path d="M12 9v12" />
    </Svg>
  ),
  CatSecurity: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  ),
  CatOutsource: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="M5 11h2v8H5z" />
      <path d="M17 11h2v8h-2z" />
      <path d="M7 14h3l2-2 4 3 1 1v3" />
      <path d="M9 11V8l3-2 3 2v3" />
    </Svg>
  ),
  CatPortaria: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <rect x="3" y="6" width="18" height="13" rx="1" />
      <circle cx="12" cy="13" r="2" />
      <path d="M3 6 12 2l9 4" />
      <path d="M8 19v2M16 19v2" />
    </Svg>
  ),
  CatFacilities: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="M14.7 6.3a4 4 0 0 1 5 5L11 20a3 3 0 0 1-5-5l8.7-8.7Z" />
      <path d="m14 7 3 3" />
    </Svg>
  ),
  CatMaintenance: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="m14.7 6.3 3 3-9.4 9.4a2 2 0 0 1-2.8-2.8l9.2-9.6Z" />
      <path d="m12 8 4 4" />
      <path d="m17 3 4 4-2 2-4-4 2-2Z" />
    </Svg>
  ),
  CatPest: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <ellipse cx="12" cy="13" rx="5" ry="6" />
      <path d="M12 7V4M9 5l-2-2M15 5l2-2" />
      <path d="M7 13H4M17 13h3M7 17l-3 2M17 17l3 2" />
    </Svg>
  ),
  CatLocker: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 12h16" />
      <circle cx="9" cy="8" r=".8" fill="currentColor" />
      <circle cx="9" cy="16" r=".8" fill="currentColor" />
    </Svg>
  ),
  CatCleaning: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="M12 2v8" />
      <path d="M9 5h6" />
      <path d="m6 22 1.5-12h9L18 22H6Z" />
    </Svg>
  ),
  CatPlumbing: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="M12 4c-3 4-3 7 0 12 3-5 3-8 0-12Z" />
      <path d="M12 16v6" />
    </Svg>
  ),
  CatElectric: ({ size = 22, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={1.6} {...rest}>
      <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />
    </Svg>
  ),
  // ===== Auth / account =====
  Lock: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  ),
  AtSign: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9" />
    </Svg>
  ),
  Eye: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  EyeOff: ({ size = 18, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1" />
      <path d="M6.6 6.6A17 17 0 0 0 2 13s3.5 7 10 7a10 10 0 0 0 5.4-1.6" />
      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
    </Svg>
  ),
  LogOut: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Svg>
  ),
  Whatsapp: ({ size = 16, style, className }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden style={style} className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  X: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} strokeWidth={2} {...rest}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  ),
  Download: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M5 20h14" />
    </Svg>
  ),
  // Alça de arrastar (drag handle) — 6 pontos em duas colunas.
  Grip: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <circle cx="9" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18.5" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  ),
  Pencil: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </Svg>
  ),
  Trash: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Svg>
  ),
  Instagram: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  ),
  Facebook: ({ size = 16, style, className }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden style={style} className={className}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
    </svg>
  ),
  TikTok: ({ size = 16, style, className }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden style={style} className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12v-3.16a5.7 5.7 0 0 0-.77-.05A5.71 5.71 0 1 0 15.54 15.4V9.01a7.34 7.34 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48z" />
    </svg>
  ),
  YouTube: ({ size = 16, style, className }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden style={style} className={className}>
      <path d="M23 12s0-3.2-.41-4.74a2.5 2.5 0 0 0-1.76-1.77C19.29 5 12 5 12 5s-7.29 0-8.83.49a2.5 2.5 0 0 0-1.76 1.77C1 8.8 1 12 1 12s0 3.2.41 4.74a2.5 2.5 0 0 0 1.76 1.77C4.71 19 12 19 12 19s7.29 0 8.83-.49a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12zm-13 3.05V8.95L15.2 12 10 15.05z" />
    </svg>
  ),
  Globe: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </Svg>
  ),
  Play: ({ size = 16, ...rest }: IconProps = {}) => (
    <Svg size={size} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5 16 12l-6 3.5z" fill="currentColor" stroke="none" />
    </Svg>
  ),
  // Brand house mark used in the header lockup.
  BrandHouse: ({ size = 22, style, className }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
      style={style}
      className={className}
    >
      <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9Z" />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" />
    </svg>
  ),
} as const;

export type IconKey = keyof typeof Icon;
