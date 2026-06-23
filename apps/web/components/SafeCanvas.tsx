'use client';

import { Component, type ReactNode } from 'react';

/** اگر WebGL/سه‌بعدی شکست خورد (بدونِ GPU، موبایلِ قدیمی، headless)، هیرو crash نشود. */
export class SafeCanvas extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* بی‌صدا degrade می‌شود؛ بقیه‌ی هیرو (CSS) سالم می‌ماند */
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
