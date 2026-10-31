import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver for JSDOM test environment
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
  }

  observe(element) {
    this.elements.add(element);
  }

  unobserve(element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  // Helper method for triggering intersection in tests if needed
  triggerIntersect(isIntersecting = true) {
    this.callback([{ isIntersecting, target: Array.from(this.elements)[0] }]);
  }
}

global.IntersectionObserver = MockIntersectionObserver;
