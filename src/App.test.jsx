import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import * as photoApi from './services/photoApi';

describe('App Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the header, loads photos from API, and supports independent likes', async () => {
    const mockPhotos = [
      { id: '10', author: 'Vadim Sherbakov', download_url: 'https://picsum.photos/id/10/2500/1667' },
      { id: '11', author: 'Alex', download_url: 'https://picsum.photos/id/11/2500/1667' },
    ];

    vi.spyOn(photoApi, 'fetchPhotos').mockResolvedValueOnce(mockPhotos);

    render(<App />);

    // Verify Header
    expect(screen.getByRole('heading', { name: /photo gallery/i })).toBeInTheDocument();

    // Verify Photos load
    await waitFor(() => {
      expect(screen.getByText('Author: Vadim Sherbakov')).toBeInTheDocument();
      expect(screen.getByText('Author: Alex')).toBeInTheDocument();
    });

    // Test like button interaction
    const likeButtons = screen.getAllByRole('button', { name: /like photo/i });
    expect(likeButtons).toHaveLength(2);

    const firstCardLikes = screen.getByTestId('like-count-10');
    const secondCardLikes = screen.getByTestId('like-count-11');

    expect(firstCardLikes).toHaveTextContent('0');
    expect(secondCardLikes).toHaveTextContent('0');

    // Click first photo like button twice
    fireEvent.click(likeButtons[0]);
    fireEvent.click(likeButtons[0]);

    expect(firstCardLikes).toHaveTextContent('2');
    expect(secondCardLikes).toHaveTextContent('0');
  });

  it('renders error message and provides retry button on fetch failure', async () => {
    vi.spyOn(photoApi, 'fetchPhotos')
      .mockRejectedValueOnce(new Error('Connection timed out'))
      .mockResolvedValueOnce([
        { id: '12', author: 'Daniel Genser', download_url: 'https://picsum.photos/id/12/2500/1667' }
      ]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Connection timed out')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Author: Daniel Genser')).toBeInTheDocument();
    });
  });
});
