import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PhotoCard from './PhotoCard';

describe('PhotoCard Component', () => {
  const originalIntersectionObserver = global.IntersectionObserver;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.IntersectionObserver = originalIntersectionObserver;
  });

  const mockPhoto1 = {
    id: '100',
    author: 'Tina Atmosphere',
    download_url: 'https://picsum.photos/id/100/2500/1656',
    width: 2500,
    height: 1656,
  };

  const mockPhoto2 = {
    id: '101',
    author: 'Christian Bardenhorst',
    download_url: 'https://picsum.photos/id/101/2621/1747',
    width: 2621,
    height: 1747,
  };

  it('renders author information accurately on the right side', () => {
    render(<PhotoCard photo={mockPhoto1} isImmediate={true} />);
    expect(screen.getByText('Author: Tina Atmosphere')).toBeInTheDocument();
  });

  it('initializes like counter to 0', () => {
    render(<PhotoCard photo={mockPhoto1} isImmediate={true} />);
    const countEl = screen.getByTestId('like-count-100');
    expect(countEl).toHaveTextContent('0');
  });

  it('increments like counter with each click', () => {
    render(<PhotoCard photo={mockPhoto1} isImmediate={true} />);
    const likeBtn = screen.getByRole('button', { name: /like photo by tina atmosphere/i });
    const countEl = screen.getByTestId('like-count-100');

    expect(countEl).toHaveTextContent('0');

    fireEvent.click(likeBtn);
    expect(countEl).toHaveTextContent('1');

    fireEvent.click(likeBtn);
    fireEvent.click(likeBtn);
    expect(countEl).toHaveTextContent('3');
  });

  it('maintains independent like counters across multiple cards', () => {
    render(
      <div>
        <PhotoCard photo={mockPhoto1} isImmediate={true} />
        <PhotoCard photo={mockPhoto2} isImmediate={true} />
      </div>
    );

    const btn1 = screen.getByRole('button', { name: /like photo by tina atmosphere/i });
    const btn2 = screen.getByRole('button', { name: /like photo by christian bardenhorst/i });

    const count1 = screen.getByTestId('like-count-100');
    const count2 = screen.getByTestId('like-count-101');

    // Click first card 2 times
    fireEvent.click(btn1);
    fireEvent.click(btn1);

    expect(count1).toHaveTextContent('2');
    expect(count2).toHaveTextContent('0'); // Second card stays 0

    // Click second card 1 time
    fireEvent.click(btn2);
    expect(count1).toHaveTextContent('2');
    expect(count2).toHaveTextContent('1');
  });

  it('handles image failure gracefully by showing fallback', () => {
    render(<PhotoCard photo={mockPhoto1} isImmediate={true} />);
    const img = screen.getByAltText('Photo by Tina Atmosphere');

    // Simulate image error
    fireEvent.error(img);

    expect(screen.getByText('Image unavailable')).toBeInTheDocument();
  });

  it('loads the first visible image immediately with eager loading and high priority', () => {
    render(<PhotoCard photo={mockPhoto1} isImmediate={true} loading="eager" fetchPriority="high" />);
    const img = screen.getByAltText('Photo by Tina Atmosphere');

    // Must use exact API-provided download_url per assignment instructions
    expect(img).toHaveAttribute('src', mockPhoto1.download_url);
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('defers below-the-fold images and switches to eager loading upon 900px intersection', () => {
    let observerCallback;
    const disconnectSpy = vi.fn();
    const observeSpy = vi.fn();

    global.IntersectionObserver = class {
      constructor(callback, options) {
        observerCallback = callback;
        expect(options.rootMargin).toBe('900px');
      }
      observe(el) {
        observeSpy(el);
      }
      unobserve() {}
      disconnect() {
        disconnectSpy();
      }
    };

    const { rerender } = render(<PhotoCard photo={mockPhoto1} isImmediate={false} loading="lazy" fetchPriority="auto" />);
    const img = screen.getByAltText('Photo by Tina Atmosphere');

    // 1. Below-the-fold image does NOT initially receive a src
    expect(img).not.toHaveAttribute('src');
    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(typeof observerCallback).toBe('function');

    // 2. Simulate intersection as user scrolls toward card (within 900px)
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    // 3. Image receives exact API-provided download_url and switches to eager loading (eliminating double lazy-loading)
    expect(img).toHaveAttribute('src', mockPhoto1.download_url);
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'auto');

    // 4. Observer is permanently disconnected once activated
    expect(disconnectSpy).toHaveBeenCalled();

    // 5. Image retains src when scrolling back or rerendering (does not re-assign or remove src)
    rerender(<PhotoCard photo={mockPhoto1} isImmediate={false} loading="lazy" fetchPriority="auto" />);
    expect(img).toHaveAttribute('src', mockPhoto1.download_url);
    expect(observeSpy).toHaveBeenCalledTimes(1);
  });

  it('handles HTMLImageElement.decode safely during image load', async () => {
    render(<PhotoCard photo={mockPhoto1} isImmediate={true} />);
    const img = screen.getByAltText('Photo by Tina Atmosphere');

    // Mock HTMLImageElement.prototype.decode
    img.decode = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.load(img);
    });

    expect(img.decode).toHaveBeenCalled();
  });
});
