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

import { describe, expect, test } from 'vitest';

import type { ImageUpdateStatus } from '/@api/image-registry';

import { formatImageDisplayName, getFullImageRef, getResultStyle, getUpdateAvailableStyle } from './update-image-util';

describe('getUpdateAvailableStyle', () => {
  test('returns Checking style when status is undefined', () => {
    const result = getUpdateAvailableStyle();
    expect(result.label).toBe('Checking');
    expect(result.dotColor).toContain('paused');
  });

  test('returns Error style when status is error', () => {
    const status: ImageUpdateStatus = {
      status: 'error',
      updateAvailable: false,
      message: 'Error message',
    };
    const result = getUpdateAvailableStyle(status);
    expect(result.label).toBe('Error');
    expect(result.dotColor).toContain('terminated');
  });

  test('returns Available style when update is available', () => {
    const status: ImageUpdateStatus = {
      status: 'normal',
      updateAvailable: true,
      message: 'Update available',
    };
    const result = getUpdateAvailableStyle(status);
    expect(result.label).toBe('Available');
    expect(result.dotColor).toContain('connected');
  });

  test('returns N/A style when status is skipped', () => {
    const status: ImageUpdateStatus = {
      status: 'skipped',
      updateAvailable: false,
      message: 'Local image',
    };
    const result = getUpdateAvailableStyle(status);
    expect(result.label).toBe('N/A');
    expect(result.dotColor).toContain('stopped');
  });

  test('returns Up to date style when no update available', () => {
    const status: ImageUpdateStatus = {
      status: 'normal',
      updateAvailable: false,
      message: 'Image is up to date',
    };
    const result = getUpdateAvailableStyle(status);
    expect(result.label).toBe('Up to date');
    expect(result.dotColor).toContain('stopped');
  });
});

describe('getResultStyle', () => {
  test('returns Updating style when updating is true', () => {
    const result = getResultStyle(true, false);
    expect(result?.label).toBe('Updating');
    expect(result?.dotColor).toContain('starting');
  });

  test('returns Updated style when updated is true', () => {
    const result = getResultStyle(false, true);
    expect(result?.label).toBe('Updated');
    expect(result?.dotColor).toContain('connected');
  });

  test('returns Failed style when error is present', () => {
    const result = getResultStyle(false, false, 'Some error');
    expect(result?.label).toBe('Failed');
    expect(result?.dotColor).toContain('terminated');
  });

  test('returns undefined when no state is active', () => {
    const result = getResultStyle(false, false);
    expect(result).toBeUndefined();
  });
});

describe('formatImageDisplayName', () => {
  test('formats image name with tag', () => {
    const result = formatImageDisplayName('nginx', 'latest');
    expect(result).toBe('nginx:latest');
  });

  test('formats image name without tag for digest', () => {
    const result = formatImageDisplayName('nginx', 'sha256:abc123');
    expect(result).toBe('nginx');
  });

  test('truncates long names', () => {
    const longName = 'very-long-image-name-that-should-be-truncated';
    const result = formatImageDisplayName(longName, 'latest', 30);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).toContain('...');
  });
});

describe('getFullImageRef', () => {
  test('returns full image reference', () => {
    const result = getFullImageRef('nginx', 'latest');
    expect(result).toBe('nginx:latest');
  });
});
