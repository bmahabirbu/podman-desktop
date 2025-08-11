/**********************************************************************
 * Copyright (C) 2023 Red Hat, Inc.
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

import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

import type { OnboardingInfo } from '/@api/onboarding';

import { EventStore } from './event-store';

const windowEvents = ['extension-stopped', 'extension-started', 'extension-failed', 'extensions-started'];
// core extensions that must finish before onboarding tiles display
const CORE_EXTENSIONS = new Set(['podman-desktop.podman', 'podman-desktop.compose', 'podman-desktop.kubectl-cli']);
const loadedExtensions = new Set<string>();
const windowListeners = ['extensions-already-started'];

let readyToUpdate = false;

export async function checkForUpdate(eventName: string, args?: unknown[]): Promise<boolean> {
  // If we're already ready, no need for further checks.
  if (readyToUpdate) {
    return true;
  }

  // Check for individual core extension events.
  if (
    (eventName === 'extension-started' || eventName === 'extension-failed') &&
    Array.isArray(args) &&
    typeof args[0] === 'string'
  ) {
    const id = args[0];
    if (CORE_EXTENSIONS.has(id)) {
      loadedExtensions.add(id);
      // If all three core extensions have reported their status, we're ready.
      if (loadedExtensions.size === CORE_EXTENSIONS.size) {
        readyToUpdate = true;
        return true;
      }
    }
  }

  // Fallback: If the core extensions don't all report for any reason,
  // the global 'extensions-already-started' will unblock the UI as a safety net.
  if (eventName === 'extensions-already-started') {
    readyToUpdate = true;
    return true;
  }

  return false;
}
export const onboardingList: Writable<OnboardingInfo[]> = writable([]);

// use helper here as window methods are initialized after the store in tests
const listOnboarding = (): Promise<OnboardingInfo[]> => {
  return window.listOnboarding();
};

export const onboardingEventStore = new EventStore<OnboardingInfo[]>(
  'onboarding',
  onboardingList,
  checkForUpdate,
  windowEvents,
  windowListeners,
  listOnboarding,
);
const onboardingEventStoreInfo = onboardingEventStore.setup();

export const fetchOnboarding = async (): Promise<void> => {
  await onboardingEventStoreInfo.fetch();
};
