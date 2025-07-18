<script lang="ts">
import { Button } from '@podman-desktop/ui-svelte';
import { onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/store';

import DevelopmentExtensionListTable from '/@/lib/extensions/dev-mode/table/ListTable.svelte';
import { extensionDevelopmentFolders } from '/@/stores/extensionDevelopmentFolders';
import { extensionInfos } from '/@/stores/extensions';
import type { ExtensionDevelopmentFolderInfo } from '/@api/extension-development-folders-info';
import type { ExtensionInfo } from '/@api/extension-info';
import { ExtensionLoaderSettings } from '/@api/extension-loader-settings';

import type { SelectableExtensionDevelopmentFolderInfoUI } from './development-folder-info-ui';
import DevelopmentExtensionEmptyScreen from './DevelopmentExtensionEmptyScreen.svelte';

let isDevelopmentModeEnabled = $state(false);

const unsubscribers: Unsubscriber[] = [];

let currentExtFolders: ExtensionDevelopmentFolderInfo[] = $state([]);
let currentExtensionInfos: ExtensionInfo[] = $state([]);

const selectableExtensionDevelopmentFolders: SelectableExtensionDevelopmentFolderInfoUI[] = $derived(
  currentExtFolders.map(folder => {
    // do we have a matching extension
    const matchingExtension = currentExtensionInfos.find(ext => ext.path === folder.path);
    let extension = undefined;
    if (matchingExtension) {
      extension = { name: matchingExtension.name, state: matchingExtension.state, id: matchingExtension.id };
    }

    return { ...folder, selected: false, name: folder.path, extension };
  }),
);

onMount(async () => {
  //
  // Check if development mode is enabled
  isDevelopmentModeEnabled =
    (await window.getConfigurationValue(
      `${ExtensionLoaderSettings.SectionName}.${ExtensionLoaderSettings.DevelopmentMode}`,
    )) ?? false;

  // subscribe to extension changes
  unsubscribers.push(
    extensionInfos.subscribe(value => {
      currentExtensionInfos = value;
    }),
  );
  unsubscribers.push(
    extensionDevelopmentFolders.subscribe(value => {
      currentExtFolders = value;
    }),
  );
});

onDestroy(() => {
  for (const unsubscriber of unsubscribers) {
    unsubscriber();
  }
});

async function addLocalFolderExtension(): Promise<void> {
  // call the openDialog
  const result = await window.openDialog({
    selectors: ['openDirectory'],
    openLabel: 'Select folder',
    title: 'Track a new extension folder',
  });
  if (result?.[0]) {
    try {
      await window.trackExtensionFolder(result[0]);
    } catch (error: unknown) {
      // show error
      await window.showMessageBox({ title: 'Error adding the folder', message: String(error), type: 'error' });
    }
  }
}
</script>

{#if isDevelopmentModeEnabled}
  <div class="bg-[var(--pd-content-card-bg)] m-2 w-full space-y-2 p-4 rounded-lg">
    <div class="flex flex-col">
      <!-- List all -->
      <div class="bg-[var(--pd-content-bg)] rounded flex flex-col p-2">
        <div class="flex flex-row w-full">
          <div class="text font-medium first-letter:uppercase pb-2">Local extension folders being tracked</div>
          <div class="flex-grow flex flex-col items-end">
            <Button on:click={addLocalFolderExtension}>Add a local folder extension...</Button>
          </div>
        </div>

        <!-- List of extensions in development mode -->
        {#if selectableExtensionDevelopmentFolders.length === 0}
          <div class="italic">No extension for now</div>
        {:else}
          <div class="mr-8">
            <DevelopmentExtensionListTable extensionFolderUIInfos={selectableExtensionDevelopmentFolders} />
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <DevelopmentExtensionEmptyScreen />
{/if}
