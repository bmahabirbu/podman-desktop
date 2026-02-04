<script lang="ts">
import { faArrowCircleDown, faCube, faDownload, faSync, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  FilteredEmptyScreen,
  NavPage,
  Table,
  TableColumn,
  TableDurationColumn,
  TableRow,
  TableSimpleColumn,
} from '@podman-desktop/ui-svelte';
import moment from 'moment';
import { onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/store';
import { router } from 'tinro';

import { withBulkConfirmation } from '/@/lib/actions/BulkActions';
import type { ContextUI } from '/@/lib/context/context';
import type { EngineInfoUI } from '/@/lib/engine/EngineInfoUI';
import Prune from '/@/lib/engine/Prune.svelte';
import ImageIcon from '/@/lib/images/ImageIcon.svelte';
import ContainerEngineEnvironmentColumn from '/@/lib/table/columns/ContainerEngineEnvironmentColumn.svelte';
import { IMAGE_LIST_VIEW_BADGES, IMAGE_LIST_VIEW_ICONS, IMAGE_VIEW_BADGES, IMAGE_VIEW_ICONS } from '/@/lib/view/views';
import { containersInfos } from '/@/stores/containers';
import { context } from '/@/stores/context';
import {
  clearImageUpdateStatus,
  getImageUpdateStatus,
  hasImageBeenChecked,
  setImageUpdateStatus,
} from '/@/stores/image-update-status-store';
import { filtered, imagesInfos, searchPattern } from '/@/stores/images';
import { providerInfos } from '/@/stores/providers';
import { saveImagesInfo } from '/@/stores/save-images-store';
import { viewsContributions } from '/@/stores/views';
import type { ContainerInfo } from '/@api/container-info';
import type { ImageInfo } from '/@api/image-info';
import type { ImageUpdateStatus } from '/@api/image-registry';
import type { ProviderContainerConnectionInfo } from '/@api/provider-info';
import type { ViewInfoUI } from '/@api/view-info';

import { ImageUtils } from './image-utils';
import ImageColumnActions from './ImageColumnActions.svelte';
import ImageColumnName from './ImageColumnName.svelte';
import ImageColumnStatus from './ImageColumnStatus.svelte';
import ImageColumnUpdateStatus from './ImageColumnUpdateStatus.svelte';
import ImageEmptyScreen from './ImageEmptyScreen.svelte';
import type { ImageInfoUI } from './ImageInfoUI';
import NoContainerEngineEmptyScreen from './NoContainerEngineEmptyScreen.svelte';
import UpdateImagesModal from './UpdateImagesModal.svelte';

interface Props {
  searchTerm?: string;
  imageEngineId?: string;
}

let { searchTerm = $bindable(''), imageEngineId = '' }: Props = $props();
$effect(() => {
  searchPattern.set(searchTerm);
});

let images: ImageInfoUI[] = $state([]);
let enginesList: EngineInfoUI[] = $state([]);

let providerConnections = $derived(
  $providerInfos
    .map(provider => provider.containerConnections)
    .flat()
    .filter(providerContainerConnection => providerContainerConnection.status === 'started'),
);

const imageUtils = new ImageUtils();

let globalContext: ContextUI;
let viewContributions: ViewInfoUI[] = [];

function updateImages(globalContext: ContextUI): void {
  const computedImages = storeImages
    .map((imageInfo: ImageInfo) =>
      imageUtils.getImagesInfoUI(imageInfo, storeContainers, globalContext, viewContributions, storeImages),
    )
    .flat();

  // update selected items and preserve update status based on current selected items
  computedImages.forEach(image => {
    const matchingImage = images.find(
      currentImage => currentImage.id === image.id && currentImage.engineId === image.engineId,
    );
    if (matchingImage) {
      image.selected = matchingImage.selected;
      // Preserve update status from previous state (in-memory)
      image.updateStatus = matchingImage.updateStatus;
      image.updateCheckInProgress = matchingImage.updateCheckInProgress;
      image.updateInProgress = matchingImage.updateInProgress;
      image.updateError = matchingImage.updateError;
    }

    // If not found in current state, try to restore from persistent store
    if (!image.updateStatus) {
      const storedStatus = getImageUpdateStatus(image.engineId, image.id, image.tag);
      if (storedStatus) {
        image.updateStatus = storedStatus.status;
      }
    }
  });
  computedImages.sort((first, second) => second.createdAt - first.createdAt);

  // Go through each image and if it has a children, remove the "children" from computedImages so they do not show up
  // in the table
  computedImages.forEach(image => {
    if (image.children) {
      image.children.forEach(child => {
        const index = computedImages.findIndex(computedImage => computedImage.id === child.id);
        if (index !== -1) {
          computedImages.splice(index, 1);
        }
      });
    }
  });

  images = computedImages;
  if (imageEngineId) {
    images = images.filter(image => image.engineId === imageEngineId);
  }

  // Map engineName, engineId and engineType from currentContainers to EngineInfoUI[]
  const engines = images.map(container => {
    return {
      name: container.engineName,
      id: container.engineId,
    };
  });

  // Remove duplicates from engines by name
  const uniqueEngines = engines.filter((engine, index, self) => index === self.findIndex(t => t.name === engine.name));

  // Set the engines to the global variable for the Prune functionality button
  enginesList = uniqueEngines;
}

let imagesUnsubscribe: Unsubscriber;
let containersUnsubscribe: Unsubscriber;
let contextsUnsubscribe: Unsubscriber;
let viewsUnsubscribe: Unsubscriber;
let storeContainers: ContainerInfo[] = [];
let storeImages: ImageInfo[] = [];

onMount(async () => {
  containersUnsubscribe = containersInfos.subscribe(value => {
    storeContainers = value;
    updateImages(globalContext);
  });

  imagesUnsubscribe = filtered.subscribe(value => {
    storeImages = value;
    updateImages(globalContext);
  });

  contextsUnsubscribe = context.subscribe(value => {
    globalContext = value;
    if (images.length > 0) {
      updateImages(globalContext);
    }
  });

  viewsUnsubscribe = viewsContributions.subscribe(value => {
    viewContributions =
      value.filter(
        view =>
          view.viewId === IMAGE_LIST_VIEW_ICONS ||
          view.viewId === IMAGE_VIEW_ICONS ||
          view.viewId === IMAGE_LIST_VIEW_BADGES ||
          view.viewId === IMAGE_VIEW_BADGES,
      ) || [];
    if (images.length > 0) {
      updateImages(globalContext);
    }
  });
});

onDestroy(() => {
  // unsubscribe from the store
  if (imagesUnsubscribe) {
    imagesUnsubscribe();
  }
  if (containersUnsubscribe) {
    containersUnsubscribe();
  }
  if (contextsUnsubscribe) {
    contextsUnsubscribe();
  }
  if (viewsUnsubscribe) {
    viewsUnsubscribe();
  }
});

function gotoBuildImage(): void {
  router.goto('/images/build');
}

function gotoPullImage(): void {
  router.goto('/images/pull');
}

function importImage(): void {
  router.goto('/images/import');
}

function loadImages(): void {
  router.goto('/images/load');
}

// delete the items selected in the list
let bulkDeleteInProgress = $state(false);
async function deleteSelectedImages(): Promise<void> {
  const selectedImages = images.filter(image => image.selected);
  if (selectedImages.length === 0) {
    return;
  }

  // mark images for deletion
  bulkDeleteInProgress = true;
  selectedImages.forEach(image => (image.status = 'DELETING'));
  images = images;

  await selectedImages.reduce((prev: Promise<void>, image) => {
    return prev
      .then(() => imageUtils.deleteImage(image))
      .catch((e: unknown) => console.error('error while removing image', e));
  }, Promise.resolve());
  bulkDeleteInProgress = false;
}

// save the items selected in the list
async function saveSelectedImages(): Promise<void> {
  const selectedImages = images.filter(image => image.selected);
  if (selectedImages.length === 0) {
    return;
  }

  saveImagesInfo.set(selectedImages);
  router.goto('/images/save');
}

// Modal state for update confirmation
let showUpdateModal = $state(false);
let selectedImagesForUpdate: ImageInfoUI[] = $state([]);

// update the items selected in the list
async function updateSelectedImages(): Promise<void> {
  const selectedImages = images.filter(image => image.selected);
  if (selectedImages.length === 0) {
    return;
  }

  // Check for updates for selected images that haven't been checked yet
  const uncheckedImages = selectedImages.filter(img => !img.updateStatus && !img.updateCheckInProgress);
  if (uncheckedImages.length > 0) {
    await Promise.all(uncheckedImages.map(img => checkImageForUpdates(img)));
  }

  // Show modal with selected images
  selectedImagesForUpdate = selectedImages;
  showUpdateModal = true;
}

function closeUpdateModal(): void {
  showUpdateModal = false;
  selectedImagesForUpdate = [];
}

async function handleUpdateFromModal(imagesToUpdate: ImageInfoUI[]): Promise<void> {
  await performBulkImageUpdate(imagesToUpdate);
}

// Force recheck images (clear stored status and recheck)
async function handleRecheckFromModal(imagesToRecheck: ImageInfoUI[]): Promise<void> {
  // Clear stored status and in-memory status for all images
  for (const image of imagesToRecheck) {
    clearImageUpdateStatus(image.engineId, image.id, image.tag);
    image.updateStatus = undefined;
  }
  images = images; // Trigger reactivity

  // Recheck all images in parallel
  await Promise.all(imagesToRecheck.map(image => forceCheckImageForUpdates(image)));
}

// Force check a single image (bypasses the "already checked" logic)
async function forceCheckImageForUpdates(image: ImageInfoUI): Promise<void> {
  if (image.updateCheckInProgress) {
    return;
  }

  image.updateCheckInProgress = true;
  images = images; // Trigger reactivity

  try {
    const imageRef = `${image.name}:${image.tag}`;
    const localDigests = getLocalDigests(image);
    const status: ImageUpdateStatus = await window.checkImageUpdateStatus(imageRef, image.tag, localDigests);
    image.updateStatus = status;

    // Store in persistent store
    setImageUpdateStatus(image.engineId, image.id, image.tag, status);
  } catch (err: unknown) {
    const errorStatus: ImageUpdateStatus = {
      status: 'error',
      updateAvailable: false,
      message: err instanceof Error ? err.message : String(err),
    };
    image.updateStatus = errorStatus;

    // Store error status too
    setImageUpdateStatus(image.engineId, image.id, image.tag, errorStatus);
  } finally {
    image.updateCheckInProgress = false;
    images = images; // Trigger reactivity
  }
}

let selectedItemsNumber: number | undefined = $state();

// Get local digests for an image from the store
function getLocalDigests(imageUI: ImageInfoUI): string[] {
  const imageInfo = storeImages.find(img => img.Id === imageUI.id);
  return imageInfo?.RepoDigests ?? [];
}

// Check for updates for a single image
async function checkImageForUpdates(image: ImageInfoUI): Promise<void> {
  // Skip if already checking or already has status
  if (image.updateCheckInProgress || image.updateStatus) {
    return;
  }

  // Check if already in the persistent store
  if (hasImageBeenChecked(image.engineId, image.id, image.tag)) {
    const storedStatus = getImageUpdateStatus(image.engineId, image.id, image.tag);
    if (storedStatus) {
      image.updateStatus = storedStatus.status;
      images = images; // Trigger reactivity
      return;
    }
  }

  image.updateCheckInProgress = true;
  images = images; // Trigger reactivity

  try {
    const imageRef = `${image.name}:${image.tag}`;
    const localDigests = getLocalDigests(image);
    const status: ImageUpdateStatus = await window.checkImageUpdateStatus(imageRef, image.tag, localDigests);
    image.updateStatus = status;

    // Store in persistent store
    setImageUpdateStatus(image.engineId, image.id, image.tag, status);
  } catch (err: unknown) {
    const errorStatus: ImageUpdateStatus = {
      status: 'error',
      updateAvailable: false,
      message: err instanceof Error ? err.message : String(err),
    };
    image.updateStatus = errorStatus;

    // Store error status too
    setImageUpdateStatus(image.engineId, image.id, image.tag, errorStatus);
  } finally {
    image.updateCheckInProgress = false;
    images = images; // Trigger reactivity
  }
}

// Check for updates for images that haven't been checked yet
async function checkUncheckedImages(): Promise<void> {
  // Only check images that don't have a status yet and aren't being checked
  const uncheckedImages = images.filter(
    image =>
      !image.updateStatus && !image.updateCheckInProgress && !hasImageBeenChecked(image.engineId, image.id, image.tag),
  );

  if (uncheckedImages.length === 0) {
    return;
  }

  // Check unchecked images in parallel
  await Promise.all(uncheckedImages.map(image => checkImageForUpdates(image)));
}

// Handle column visibility change
function handleColumnVisibilityChange(columnId: string, enabled: boolean): void {
  if (columnId === 'Update Available' && enabled) {
    // Only check images that haven't been checked yet
    checkUncheckedImages().catch((err: unknown) => {
      console.error('Failed to check for updates:', err);
    });
  }
}

// Find the provider connection for an image using engineId
function getProviderConnection(engineId: string): ProviderContainerConnectionInfo | undefined {
  const dotIndex = engineId.indexOf('.');
  if (dotIndex === -1) {
    return providerConnections.find(conn => conn.name === engineId);
  }

  const providerId = engineId.substring(0, dotIndex);
  const connectionName = engineId.substring(dotIndex + 1);

  const provider = $providerInfos.find(p => p.id === providerId);
  if (provider) {
    return provider.containerConnections.find(conn => conn.name === connectionName && conn.status === 'started');
  }

  return undefined;
}

// Update a single image (pull new version)
async function performImageUpdate(image: ImageInfoUI): Promise<void> {
  const providerConnection = getProviderConnection(image.engineId);
  if (!providerConnection) {
    image.updateError = `No provider connection found for engineId "${image.engineId}"`;
    images = images;
    return;
  }

  image.updateInProgress = true;
  image.updateError = undefined;
  images = images; // Trigger reactivity

  try {
    const imageRef = `${image.name}:${image.tag}`;
    await window.pullImage(providerConnection, imageRef, () => {});

    // After successful pull, update status to "Up to date"
    const upToDateStatus: ImageUpdateStatus = {
      status: 'normal',
      updateAvailable: false,
      message: 'Image is up to date',
    };
    image.updateStatus = upToDateStatus;

    // Update the persistent store with the new status
    setImageUpdateStatus(image.engineId, image.id, image.tag, upToDateStatus);
  } catch (err: unknown) {
    image.updateError = err instanceof Error ? err.message : String(err);
  } finally {
    image.updateInProgress = false;
    images = images; // Trigger reactivity
  }
}

// Update multiple images (called from modal)
async function performBulkImageUpdate(imagesToUpdate: ImageInfoUI[]): Promise<void> {
  // Update all images in parallel
  await Promise.all(imagesToUpdate.map(image => performImageUpdate(image)));
}

let statusColumn = new TableColumn<ImageInfoUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: ImageColumnStatus,
  comparator: (a, b): number => b.status.localeCompare(a.status),
});

let nameColumn = new TableColumn<ImageInfoUI>('Name', {
  width: '4fr',
  renderer: ImageColumnName,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let envColumn = new TableColumn<ImageInfoUI>('Environment', {
  renderer: ContainerEngineEnvironmentColumn,
  comparator: (a, b): number => a.engineId.localeCompare(b.engineId),
});

let ageColumn = new TableColumn<ImageInfoUI, Date>('Age', {
  renderMapping: (image): Date => moment.unix(image.createdAt).toDate(),
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment().diff(moment.unix(a.createdAt)) - moment().diff(moment.unix(b.createdAt)),
});

let sizeColumn = new TableColumn<ImageInfoUI, string>('Size', {
  align: 'right',
  renderMapping: (image): string => image.humanSize,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => b.size - a.size,
});

let archColumn = new TableColumn<ImageInfoUI, string>('Arch', {
  width: '1fr',
  align: 'right',
  renderMapping: (image): string => image.arch,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.arch.localeCompare(b.arch),
});

let updateColumn = new TableColumn<ImageInfoUI>('Update Available', {
  width: '1fr',
  align: 'right',
  renderer: ImageColumnUpdateStatus,
  comparator: (a, b): number => {
    // Sort by update availability (available first)
    const aAvailable = a.updateStatus?.updateAvailable ? 1 : 0;
    const bAvailable = b.updateStatus?.updateAvailable ? 1 : 0;
    return bAvailable - aAvailable;
  },
});

const columns = [
  statusColumn,
  nameColumn,
  envColumn,
  ageColumn,
  sizeColumn,
  archColumn,
  updateColumn,
  new TableColumn<ImageInfoUI>('Actions', {
    align: 'right',
    width: '150px',
    renderer: ImageColumnActions,
    overflow: true,
  }),
];

const row = new TableRow<ImageInfoUI>({
  // If it is a manifest, it is not selectable (no delete functionality yet)
  selectable: (image): boolean => image.status === 'UNUSED' && !image.isManifest,
  disabledText: 'Image is used by a container',
  children: (image): ImageInfoUI[] => {
    return image.children ?? [];
  },
});

/**
 * Utility function for the Table to get the key to use for each item
 */
function key(item: ImageInfoUI): string {
  return `${item.engineId}:${item.id}`;
}
/**
 * Utility function for the Table to get the label to use for each item
 */
function label(item: ImageInfoUI): string {
  return item.name;
}
</script>

<NavPage bind:searchTerm={searchTerm} title="images">
  {#snippet additionalActions()}
    {#if $imagesInfos.length > 0}
      <Prune type="images" engines={enginesList} />
    {/if}
    <Button
      on:click={loadImages}
      title="Load Images From Tar Archives"
      icon={faUpload}
      aria-label="Load Images">
      Load
    </Button>
    <Button
      on:click={importImage}
      title="Import Containers From Filesystem"
      icon={faArrowCircleDown}
      aria-label="Import Image">
      Import
    </Button>
    <Button on:click={gotoPullImage} title="Pull Image From a Registry" icon={faArrowCircleDown}>Pull</Button>
    <Button on:click={gotoBuildImage} title="Build Image From Containerfile" icon={faCube}>Build</Button>
  {/snippet}

  {#snippet bottomAdditionalActions()}
    {#if selectedItemsNumber && selectedItemsNumber > 0}
      <Button
        on:click={(): void => {
          if (selectedItemsNumber) {withBulkConfirmation(
            deleteSelectedImages,
            `delete ${selectedItemsNumber} image${selectedItemsNumber > 1 ? 's' : ''}`,
          );}}}
        title="Delete {selectedItemsNumber} selected items"
        inProgress={bulkDeleteInProgress}
        icon={faTrash} />
      <Button
        on:click={saveSelectedImages}
        title="Save {selectedItemsNumber} selected items"
        aria-label="Save images"
        icon={faDownload} />
      <Button
        on:click={updateSelectedImages}
        title="Update {selectedItemsNumber} selected items"
        aria-label="Update images"
        icon={faSync} />
      <span>On {selectedItemsNumber} selected items.</span>
    {/if}
  {/snippet}

  {#snippet content()}
  <div class="flex min-w-full h-full">

    {#if providerConnections.length === 0}
      <NoContainerEngineEmptyScreen />
    {:else if $filtered.length === 0}
      {#if searchTerm}
        <FilteredEmptyScreen icon={ImageIcon} kind="images" bind:searchTerm={searchTerm} />
      {:else}
        <ImageEmptyScreen />
      {/if}
    {:else}
      <Table
        kind="image"
        bind:selectedItemsNumber={selectedItemsNumber}
        data={images}
        columns={columns}
        row={row}
        defaultSortColumn="Age"
        key={key}
        label={label}
        enableLayoutConfiguration={true}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        on:update={(): ImageInfoUI[] => (images = images)}>
      </Table>
    {/if}
  </div>
  {/snippet}
</NavPage>

{#if showUpdateModal}
  <UpdateImagesModal
    images={selectedImagesForUpdate}
    onClose={closeUpdateModal}
    onUpdate={handleUpdateFromModal}
    onRecheck={handleRecheckFromModal} />
{/if}
