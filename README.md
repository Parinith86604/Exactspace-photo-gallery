# ExactSpace Photo Gallery

A responsive ReactJS Photo Gallery application developed as part of the ExactSpace Technologies Frontend/UI Developer internship assignment.

## Overview

The application fetches photographs from the Picsum Photos API and displays them in a clean, single-column gallery. Each photo includes its author information and an independent like counter.

## Features

- Fetch photographs using the Picsum Photos API.
- Display photo thumbnails and author names.
- Independent like counters for every photo.
- Automatic infinite scrolling using IntersectionObserver.
- Duplicate photo prevention.
- Loading and error states with retry functionality.
- Image loading and failure handling.
- Responsive desktop, tablet and mobile layouts.

## Tech Stack

- React
- JavaScript
- Vite
- CSS
- Font Awesome
- Vitest
- React Testing Library

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Parinith86604/Exactspace-photo-gallery.git
```

### 2. Open the project folder

```bash
cd Exactspace-photo-gallery
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Testing

Run the automated tests:

```bash
npm run test
```

## Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## API

Photo data is retrieved from:

`https://picsum.photos/v2/list?page=1`

Subsequent pages are fetched automatically as the user scrolls.

## Project Structure

```text
photo-gallery/
├── src/
│   ├── components/
│   │   ├── ErrorMessage.jsx
│   │   ├── GalleryHeader.jsx
│   │   ├── LoadingIndicator.jsx
│   │   └── PhotoCard.jsx
│   ├── hooks/
│   │   └── useInfinitePhotos.js
│   ├── services/
│   │   └── photoApi.js
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── package-lock.json
└── vite.config.js
```

## Repository

[ExactSpace Photo Gallery – GitHub](https://github.com/Parinith86604/Exactspace-photo-gallery)

Developed by **Parinith N**.
