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
import Label from '/@/lib/ui/Label.svelte';

import { getUpdateAvailableStyle } from './update-image-util';
import type { UpdateImageInfoUI } from './UpdateImages.svelte';

interface Props {
  object: UpdateImageInfoUI;
}

let { object }: Props = $props();

let statusStyle = $derived(getUpdateAvailableStyle(object.status));
let isError = $derived(object.status?.status === 'error');
let errorMessage = $derived(object.status?.message ?? 'Error checking for updates');
</script>

<div class="flex flex-col gap-1 items-start text-left">
  <div class="flex items-start" title={isError ? errorMessage : undefined}>
    <Label role="status" name={statusStyle.label}>
      <div class="w-2 h-2 shrink-0 {statusStyle.dotColor} rounded-full"></div>
    </Label>
  </div>
</div>
