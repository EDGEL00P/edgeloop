/**
 * LOGO WATERMARK
 * Large background watermark version of ESPN EDGELOOP logo
 */

'use client';

import { EdgeloopLogo } from './EdgeloopLogo';

export function LogoWatermark() {
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-[0.03]">
      <EdgeloopLogo size="xl" animated={false} />
    </div>
  );
}
