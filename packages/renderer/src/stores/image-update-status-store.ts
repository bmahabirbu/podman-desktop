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

import { writable } from 'svelte/store';

import type { ImageUpdateStatus } from '/@api/image-registry';

/**
 * Store entry for an image's update status
 */
export interface ImageUpdateStatusEntry {
  status: ImageUpdateStatus;
  checkedAt: number; // timestamp when the check was performed
}

/**
 * Map of image key (engineId:imageId:tag) to update status
 */
const imageUpdateStatusMap = writable<Map<string, ImageUpdateStatusEntry>>(new Map());

/**
 * Get a unique key for an image
 */
export function getImageUpdateKey(engineId: string, imageId: string, tag: string): string {
  return `${engineId}:${imageId}:${tag}`;
}

/**
 * Get the update status for an image
 */
export function getImageUpdateStatus(
  engineId: string,
  imageId: string,
  tag: string,
): ImageUpdateStatusEntry | undefined {
  let result: ImageUpdateStatusEntry | undefined;
  imageUpdateStatusMap.subscribe(map => {
    result = map.get(getImageUpdateKey(engineId, imageId, tag));
  })();
  return result;
}

/**
 * Set the update status for an image
 */
export function setImageUpdateStatus(engineId: string, imageId: string, tag: string, status: ImageUpdateStatus): void {
  imageUpdateStatusMap.update(map => {
    const newMap = new Map(map);
    newMap.set(getImageUpdateKey(engineId, imageId, tag), {
      status,
      checkedAt: Date.now(),
    });
    return newMap;
  });
}

/**
 * Check if an image has been checked for updates
 */
export function hasImageBeenChecked(engineId: string, imageId: string, tag: string): boolean {
  return getImageUpdateStatus(engineId, imageId, tag) !== undefined;
}

/**
 * Clear update status for a specific image (e.g., after successful update)
 */
export function clearImageUpdateStatus(engineId: string, imageId: string, tag: string): void {
  imageUpdateStatusMap.update(map => {
    const newMap = new Map(map);
    newMap.delete(getImageUpdateKey(engineId, imageId, tag));
    return newMap;
  });
}

/**
 * Clear all update statuses (e.g., on app restart or manual refresh)
 */
export function clearAllImageUpdateStatuses(): void {
  imageUpdateStatusMap.set(new Map());
}

/**
 * Export the store for subscription
 */
export const imageUpdateStatuses = imageUpdateStatusMap;
