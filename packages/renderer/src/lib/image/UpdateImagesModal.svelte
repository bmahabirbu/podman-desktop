<!--
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
-->
<script lang="ts">
import {
  faCheckCircle,
  faExclamationTriangle,
  faRefresh,
  faSync,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Button, Modal } from '@podman-desktop/ui-svelte';
import Fa from 'svelte-fa';

import type { ImageInfoUI } from './ImageInfoUI';

interface Props {
  images: ImageInfoUI[];
  onClose: () => void;
  onUpdate: (imagesToUpdate: ImageInfoUI[]) => Promise<void>;
  onRecheck: (imagesToRecheck: ImageInfoUI[]) => Promise<void>;
}

let { images, onClose, onUpdate, onRecheck }: Props = $props();

let updateInProgress = $state(false);
let recheckInProgress = $state(false);

// Track if any images are currently being checked
let imagesBeingChecked = $derived(images.filter(img => img.updateCheckInProgress));

// Calculate updatable images (have updateStatus with updateAvailable = true and no errors)
let updatableImages = $derived(
  images.filter(
    img => img.updateStatus?.updateAvailable === true && img.updateStatus?.status !== 'error' && !img.updateError,
  ),
);

// Calculate images that cannot be updated
let nonUpdatableImages = $derived(
  images.filter(
    img =>
      !img.updateStatus?.updateAvailable ||
      img.updateStatus?.status === 'error' ||
      img.updateStatus?.status === 'skipped' ||
      img.updateError,
  ),
);

// Categorize non-updatable images
let imagesWithErrors = $derived(
  nonUpdatableImages.filter(img => img.updateStatus?.status === 'error' || img.updateError),
);

let imagesUpToDate = $derived(
  nonUpdatableImages.filter(
    img => img.updateStatus?.status === 'normal' && !img.updateStatus?.updateAvailable && !img.updateError,
  ),
);

let imagesSkipped = $derived(nonUpdatableImages.filter(img => img.updateStatus?.status === 'skipped'));

let imagesNotChecked = $derived(nonUpdatableImages.filter(img => !img.updateStatus));

async function handleUpdate(): Promise<void> {
  if (updatableImages.length === 0) {
    return;
  }

  updateInProgress = true;
  try {
    await onUpdate(updatableImages);
    onClose();
  } catch (err: unknown) {
    console.error('Failed to update images:', err);
  } finally {
    updateInProgress = false;
  }
}

async function handleRecheck(): Promise<void> {
  recheckInProgress = true;
  try {
    await onRecheck(images);
  } catch (err: unknown) {
    console.error('Failed to recheck images:', err);
  } finally {
    recheckInProgress = false;
  }
}
</script>

<Modal name="Update Images" onclose={onClose}>
  <div class="flex flex-col p-5 gap-4">
    <div class="flex items-center gap-3">
      <Fa icon={faSync} class="text-[var(--pd-modal-header-text)] text-xl" />
      <h2 class="text-xl font-semibold text-[var(--pd-modal-header-text)]">Update Images</h2>
    </div>

    <div class="flex flex-col gap-3 text-[var(--pd-modal-text)]">
      <!-- Summary -->
      <div class="flex flex-col gap-2 p-3 bg-[var(--pd-content-card-bg)] rounded-lg">
        <div class="flex items-center gap-2">
          {#if updatableImages.length > 0}
            <Fa icon={faCheckCircle} class="text-[var(--pd-status-connected)]" />
            <span>
              <strong>{updatableImages.length}</strong>
              {updatableImages.length === 1 ? 'image' : 'images'} available to update
            </span>
          {:else}
            <Fa icon={faTimesCircle} class="text-[var(--pd-status-stopped)]" />
            <span>No images available to update</span>
          {/if}
        </div>

        {#if nonUpdatableImages.length > 0}
          <div class="flex items-center gap-2 text-sm text-[var(--pd-table-body-text-secondary)]">
            <Fa icon={faExclamationTriangle} class="text-[var(--pd-status-paused)]" />
            <span>
              <strong>{nonUpdatableImages.length}</strong>
              {nonUpdatableImages.length === 1 ? 'image' : 'images'} cannot be updated
            </span>
          </div>
        {/if}
      </div>

      <!-- Breakdown of non-updatable images -->
      {#if nonUpdatableImages.length > 0}
        <div class="flex flex-col gap-1 text-sm text-[var(--pd-table-body-text-secondary)] pl-2">
          {#if imagesWithErrors.length > 0}
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-[var(--pd-status-terminated)] rounded-full"></span>
              <span>{imagesWithErrors.length} with errors</span>
            </div>
          {/if}
          {#if imagesUpToDate.length > 0}
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-[var(--pd-status-stopped)] rounded-full"></span>
              <span>{imagesUpToDate.length} already up to date</span>
            </div>
          {/if}
          {#if imagesSkipped.length > 0}
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-[var(--pd-status-stopped)] rounded-full"></span>
              <span>{imagesSkipped.length} skipped (local or immutable)</span>
            </div>
          {/if}
          {#if imagesNotChecked.length > 0}
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-[var(--pd-status-paused)] rounded-full"></span>
              <span>{imagesNotChecked.length} not checked yet</span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- List of images to update -->
      {#if updatableImages.length > 0}
        <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
          <span class="text-sm font-medium">Images to update:</span>
          {#each updatableImages as image (image.id)}
            <div class="text-sm text-[var(--pd-table-body-text-secondary)] pl-2 truncate" title="{image.name}:{image.tag}">
              {image.name}:{image.tag}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Action buttons -->
    <div class="flex justify-between gap-3 pt-2">
      <Button
        type="secondary"
        on:click={handleRecheck}
        disabled={updateInProgress || recheckInProgress || imagesBeingChecked.length > 0}
        icon={faRefresh}
        inProgress={recheckInProgress || imagesBeingChecked.length > 0}
        title="Recheck all selected images for updates">
        {#if recheckInProgress || imagesBeingChecked.length > 0}
          Checking...
        {:else}
          Recheck All
        {/if}
      </Button>
      <div class="flex gap-3">
        <Button type="secondary" on:click={onClose} disabled={updateInProgress || recheckInProgress}>
          Cancel
        </Button>
        <Button
          type="primary"
          on:click={handleUpdate}
          disabled={updatableImages.length === 0 || updateInProgress || recheckInProgress}
          icon={faSync}
          inProgress={updateInProgress}>
          {#if updateInProgress}
            Updating...
          {:else}
            Update {updatableImages.length} {updatableImages.length === 1 ? 'Image' : 'Images'}
          {/if}
        </Button>
      </div>
    </div>
  </div>
</Modal>
