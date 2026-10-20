import type { ImgHTMLAttributes } from 'react';
import { brandAssets } from '../../brand/assets';

export default function BrandLogo({ tone = 'onLight', alt = brandAssets.logo.alt, ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { tone?: 'onLight' | 'onDark' }) {
  return <img {...props} src={brandAssets.logo[tone]} alt={alt} />;
}
