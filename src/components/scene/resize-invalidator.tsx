'use client';

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export function ResizeInvalidator() {
  const { invalidate, gl } = useThree();
  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(() => invalidate());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [invalidate, gl]);
  return null;
}
