'use client';

import { useEffect } from 'react';
import { addBasePath } from 'next/dist/client/add-base-path';

export function MaterialSymbolsFont() {
  useEffect(() => {
    const fontUrl = addBasePath('/fonts/MaterialSymbolsRounded.woff2');

    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Material Symbols Rounded';
        font-style: normal;
        font-weight: 100 700;
        font-display: swap;
        src: url('${fontUrl}') format('woff2-variations');
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
