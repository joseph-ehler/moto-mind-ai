/**
 * E2E TESTS: Capture Flow
 * 
 * Tests for the photo capture flow
 */

import { test, expect } from '@playwright/test'

test.describe('Capture Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to capture page
    await page.goto('/capture')
  })

  test('should show camera interface', async ({ page }) => {
    // Wait for camera to load
    await page.waitForSelector('[data-testid="camera"]')

    // Check camera is visible
    const camera = page.locator('[data-testid="camera"]')
    await expect(camera).toBeVisible()
  })

  test('should allow photo capture', async ({ page }) => {
    // Grant camera permissions (in test environment)
    await page.context().grantPermissions(['camera'])

    // Click capture button
    await page.click('[data-testid="capture-button"]')

    // Wait for preview
    await page.waitForSelector('[data-testid="photo-preview"]')

    // Check preview is visible
    const preview = page.locator('[data-testid="photo-preview"]')
    await expect(preview).toBeVisible()
  })

  test('should show quality feedback', async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera'])

    // Capture photo
    await page.click('[data-testid="capture-button"]')

    // Wait for quality analysis
    await page.waitForSelector('[data-testid="quality-score"]')

    // Check quality score is displayed
    const qualityScore = page.locator('[data-testid="quality-score"]')
    await expect(qualityScore).toBeVisible()
  })

  test('should allow retake', async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera'])

    // Capture photo
    await page.click('[data-testid="capture-button"]')

    // Wait for preview
    await page.waitForSelector('[data-testid="photo-preview"]')

    // Click retake
    await page.click('[data-testid="retake-button"]')

    // Check camera is visible again
    const camera = page.locator('[data-testid="camera"]')
    await expect(camera).toBeVisible()
  })

  test('should allow save and continue', async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera'])

    // Capture photo
    await page.click('[data-testid="capture-button"]')

    // Wait for preview
    await page.waitForSelector('[data-testid="photo-preview"]')

    // Click save
    await page.click('[data-testid="save-button"]')

    // Check navigation to next step
    await page.waitForURL('**/capture/details')
  })
})

test.describe('Capture Flow - Offline', () => {
  test('should queue photo when offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)

    // Navigate to capture page
    await page.goto('/capture')

    // Grant camera permissions
    await context.grantPermissions(['camera'])

    // Capture photo
    await page.click('[data-testid="capture-button"]')

    // Wait for preview
    await page.waitForSelector('[data-testid="photo-preview"]')

    // Click save
    await page.click('[data-testid="save-button"]')

    // Check for offline indicator
    await page.waitForSelector('[data-testid="offline-indicator"]')

    // Check for queued message
    const message = page.locator('text=/queued/i')
    await expect(message).toBeVisible()
  })

  test('should sync when back online', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)

    // Navigate to capture page
    await page.goto('/capture')

    // Grant camera permissions
    await context.grantPermissions(['camera'])

    // Capture photo
    await page.click('[data-testid="capture-button"]')
    await page.waitForSelector('[data-testid="photo-preview"]')
    await page.click('[data-testid="save-button"]')

    // Wait for queue
    await page.waitForSelector('text=/queued/i')

    // Go back online
    await context.setOffline(false)

    // Wait for sync
    await page.waitForSelector('text=/syncing/i', { timeout: 10000 })

    // Check sync complete
    await page.waitForSelector('text=/synced/i', { timeout: 10000 })
  })
})
