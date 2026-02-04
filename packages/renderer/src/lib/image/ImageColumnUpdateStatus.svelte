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
import { Spinner } from '@podman-desktop/ui-svelte';

import Label from '/@/lib/ui/Label.svelte';

import type { ImageInfoUI } from './ImageInfoUI';
import { getUpdateAvailableStyle } from './update-image-util';

interface Props {
  object: ImageInfoUI;
}

let { object }: Props = $props();

let statusStyle = $derived(getUpdateAvailableStyle(object.updateStatus));
let isError = $derived(object.updateStatus?.status === 'error' || !!object.updateError);
let isChecking = $derived(object.updateCheckInProgress);
let isUpdating = $derived(object.updateInProgress);
let errorMessage = $derived(object.updateStatus?.message ?? object.updateError ?? 'Error checking for updates');
</script>

<div class="flex flex-col gap-1 items-start text-left">
  {#if isChecking}
    <div class="flex items-center gap-1">
      <Spinner size="1em" />
      <span class="text-xs text-[var(--pd-table-body-text-secondary)]">Checking</span>
    </div>
  {:else if isUpdating}
    <div class="flex items-center gap-1">
      <Spinner size="1em" />
      <span class="text-xs text-[var(--pd-table-body-text-secondary)]">Updating</span>
    </div>
  {:else if isError}
    <div class="flex items-start" title={errorMessage}>
      <Label role="status" name={statusStyle.label}>
        <div class="w-2 h-2 shrink-0 {statusStyle.dotColor} rounded-full"></div>
      </Label>
    </div>
  {:else if object.updateStatus}
    <div class="flex items-start">
      <Label role="status" name={statusStyle.label}>
        <div class="w-2 h-2 shrink-0 {statusStyle.dotColor} rounded-full"></div>
      </Label>
    </div>
  {:else}
    <span class="text-xs text-[var(--pd-table-body-text-secondary)]">-</span>
  {/if}
</div>
