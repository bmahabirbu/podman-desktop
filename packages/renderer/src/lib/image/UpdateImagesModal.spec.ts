/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import type { ImageInfoUI } from './ImageInfoUI';
import UpdateImagesModal from './UpdateImagesModal.svelte';

let imageIdCounter = 0;
const createImage = (overrides: Partial<ImageInfoUI> = {}): ImageInfoUI => ({
  id: `image-${imageIdCounter++}`,
  shortId: '1234567',
  name: 'test-image',
  engineId: 'podman.podman-machine-default',
  engineName: 'podman',
  tag: 'latest',
  createdAt: 0,
  age: '',
  arch: 'amd64',
  size: 1000,
  humanSize: '1KB',
  base64RepoTag: 'dGVzdC1pbWFnZTpsYXRlc3Q=',
  selected: true,
  status: 'UNUSED',
  badges: [],
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
});

test('Expect modal to show update counts for images with updates available', async () => {
  const images: ImageInfoUI[] = [
    createImage({
      name: 'image1',
      updateStatus: { status: 'normal', updateAvailable: true, message: 'Update available' },
    }),
    createImage({
      name: 'image2',
      updateStatus: { status: 'normal', updateAvailable: true, message: 'Update available' },
    }),
  ];

  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRecheck = vi.fn().mockResolvedValue(undefined);

  render(UpdateImagesModal, { images, onClose, onUpdate, onRecheck });

  // Should show 2 images available to update
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText(/images available to update/)).toBeInTheDocument();
});

test('Expect modal to show 0 images when none have updates available', async () => {
  const images: ImageInfoUI[] = [
    createImage({
      name: 'image1',
      updateStatus: { status: 'normal', updateAvailable: false, message: 'Up to date' },
    }),
    createImage({
      name: 'image2',
      updateStatus: { status: 'error', updateAvailable: false, message: 'Error' },
    }),
  ];

  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRecheck = vi.fn().mockResolvedValue(undefined);

  render(UpdateImagesModal, { images, onClose, onUpdate, onRecheck });

  expect(screen.getByText('No images available to update')).toBeInTheDocument();
});

test('Expect modal to show non-updatable images breakdown', async () => {
  const images: ImageInfoUI[] = [
    createImage({
      name: 'updatable',
      updateStatus: { status: 'normal', updateAvailable: true, message: 'Update available' },
    }),
    createImage({
      name: 'error-image',
      updateStatus: { status: 'error', updateAvailable: false, message: 'Error' },
    }),
    createImage({
      name: 'up-to-date',
      updateStatus: { status: 'normal', updateAvailable: false, message: 'Up to date' },
    }),
    createImage({
      name: 'skipped',
      updateStatus: { status: 'skipped', updateAvailable: false, message: 'Local image' },
    }),
  ];

  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRecheck = vi.fn().mockResolvedValue(undefined);

  render(UpdateImagesModal, { images, onClose, onUpdate, onRecheck });

  // Should show breakdown of non-updatable images
  expect(screen.getByText(/3/)).toBeInTheDocument();
  expect(screen.getByText(/cannot be updated/)).toBeInTheDocument();
  expect(screen.getByText('1 with errors')).toBeInTheDocument();
  expect(screen.getByText('1 already up to date')).toBeInTheDocument();
  expect(screen.getByText(/1 skipped/)).toBeInTheDocument();
});

test('Expect Update button to be disabled when no images can be updated', async () => {
  const images: ImageInfoUI[] = [
    createImage({
      name: 'error-image',
      updateStatus: { status: 'error', updateAvailable: false, message: 'Error' },
    }),
  ];

  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRecheck = vi.fn().mockResolvedValue(undefined);

  render(UpdateImagesModal, { images, onClose, onUpdate, onRecheck });

  const updateButton = screen.getByRole('button', { name: /Update 0 Images/i });
  expect(updateButton).toBeDisabled();
});

test('Expect Update button to be enabled when images can be updated', async () => {
  const images: ImageInfoUI[] = [
    createImage({
      name: 'updatable',
      updateStatus: { status: 'normal', updateAvailable: true, message: 'Update available' },
    }),
  ];

  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRecheck = vi.fn().mockResolvedValue(undefined);

  render(UpdateImagesModal, { images, onClose, onUpdate, onRecheck });

  const updateButton = screen.getByRole('button', { name: /Update 1 Image/i });
  expect(updateButton).toBeEnabled();
});

test('Expect Cancel button to call onClose', async () => {
  const images: ImageInfoUI[] = [
    createImage({
      updateStatus: { status: 'normal', updateAvailable: true, message: 'Update available' },
    }),
  ];

  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRecheck = vi.fn().mockResolvedValue(undefined);

  render(UpdateImagesModal, { images, onClose, onUpdate, onRecheck });

  const cancelButton = screen.getByRole('button', { name: 'Cancel' });
  await fireEvent.click(cancelButton);

  expect(onClose).toHaveBeenCalledTimes(1);
});

test('Expect Update button to call onUpdate with updatable images only', async () => {
  const updatableImage = createImage({
    name: 'updatable',
    updateStatus: { status: 'normal', updateAvailable: true, message: 'Update available' },
  });
  const nonUpdatableImage = createImage({
    name: 'error-image',
    updateStatus: { status: 'error', updateAvailable: false, message: 'Error' },
  });

  const images: ImageInfoUI[] = [updatableImage, nonUpdatableImage];

  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRecheck = vi.fn().mockResolvedValue(undefined);

  render(UpdateImagesModal, { images, onClose, onUpdate, onRecheck });

  const updateButton = screen.getByRole('button', { name: /Update 1 Image/i });
  await fireEvent.click(updateButton);

  expect(onUpdate).toHaveBeenCalledWith([updatableImage]);
});

test('Expect images to update to be listed', async () => {
  const images: ImageInfoUI[] = [
    createImage({
      name: 'nginx',
      tag: 'latest',
      updateStatus: { status: 'normal', updateAvailable: true, message: 'Update available' },
    }),
    createImage({
      name: 'redis',
      tag: '7.0',
      updateStatus: { status: 'normal', updateAvailable: true, message: 'Update available' },
    }),
  ];

  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRecheck = vi.fn().mockResolvedValue(undefined);

  render(UpdateImagesModal, { images, onClose, onUpdate, onRecheck });

  expect(screen.getByText('Images to update:')).toBeInTheDocument();
  expect(screen.getByText('nginx:latest')).toBeInTheDocument();
  expect(screen.getByText('redis:7.0')).toBeInTheDocument();
});

test('Expect Recheck All button to call onRecheck with all images', async () => {
  const image1 = createImage({
    name: 'image1',
    updateStatus: { status: 'normal', updateAvailable: true, message: 'Update available' },
  });
  const image2 = createImage({
    name: 'image2',
    updateStatus: { status: 'normal', updateAvailable: false, message: 'Up to date' },
  });

  const images: ImageInfoUI[] = [image1, image2];

  const onClose = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRecheck = vi.fn().mockResolvedValue(undefined);

  render(UpdateImagesModal, { images, onClose, onUpdate, onRecheck });

  const recheckButton = screen.getByRole('button', { name: /Recheck All/i });
  expect(recheckButton).toBeInTheDocument();
  await fireEvent.click(recheckButton);

  expect(onRecheck).toHaveBeenCalledWith(images);
});
