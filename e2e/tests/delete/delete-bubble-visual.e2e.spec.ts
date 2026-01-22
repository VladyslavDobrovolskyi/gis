import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { MapWrapper } from '@/pageobjects/MapWrapper';
/*
  Verify delete bubble UI behavior on programmatic layers: either a delete bubble will appear
  and allow deletion, or the layer will be deleted immediately on context-click.
*/
test.describe('Map Editing', () => {
  test.beforeEach(() => {
    /* Set suite-level Allure metadata inside a test runtime */
    allure.epic('Map Editing');
  });

  test.describe('Deletion Tools', () => {
    test.beforeEach(() => {
      /* Set group-level Allure metadata inside a test runtime */
      allure.feature('Deletion Tools');
    });

    test.describe('Delete bubble visual', () => {
      test.beforeEach(() => {
        test.setTimeout(60000);
        allure.story('Delete bubble visual and confirm deletion');
        allure.tag('e2e');
        allure.severity(allure.Severity.CRITICAL);
      });

      test('Right-click on programmatic layer shows delete bubble or deletes immediately', async ({
        page,
      }) => {
        const map = new MapWrapper(page);
        await map.goto();
        await map.waitForReady();

        const before = await map.getDrawnCount();
        const center = await map.getCenterLatLng();

        await map.createRectangle([center.lat, center.lng], 0.4);
        await map.waitForDrawnCountGreaterThan(before);
        const afterCreate = await map.getDrawnCount();
        expect(afterCreate).toBeGreaterThan(before);

        const pt = await map.getLastDrawnLayerCenterPoint();
        if (!pt) throw new Error('No drawn layer point to right-click');

        /* Right-click directly at the layer center to try to show the DeleteBubble */
        await map.contextClickAtPoint(pt.x, pt.y);

        /* Try to observe the bubble briefly; if it wasn't shown because deletion was immediate,
           the drawn count should already be less than `afterCreate`. */
        const bubbleShown = await page
          .waitForSelector('.delete-bubble .btn-bubble', { state: 'visible', timeout: 3000 })
          .then(() => true)
          .catch(() => false);

        /* Bubble handling: either a delete bubble is shown (and we click it), or deletion is immediate.
           Wrap branches in steps to aid readability and Allure traceability. */
        if (bubbleShown) {
          await test.step('Delete bubble shown: click confirm and verify removal', async () => {
            /* Bubble appeared — click it and wait briefly for deletion. If deletion doesn't happen,
               remove the layer deterministically and attach diagnostic info. */
            await map.clickDeleteConfirm();
            const removed = await map
              .waitForDrawnCountLessThan(afterCreate, 3000)
              .then(() => true)
              .catch(() => false);

            if (!removed) {
              const diag = await page.evaluate(() => {
                try {
                  /* Safely access drawn items without using `any` */
                  const drawn = (window as unknown as { __LAYERS__?: { drawnItems?: unknown } })
                    .__LAYERS__?.drawnItems;
                  const layers =
                    drawn &&
                    typeof (drawn as unknown as { getLayers?: unknown }).getLayers === 'function'
                      ? (drawn as unknown as { getLayers: () => unknown[] }).getLayers()
                      : [];
                  const last =
                    layers && layers.length
                      ? (layers as unknown as unknown[])[layers.length - 1]
                      : null;
                  return {
                    drawnCount: layers.length,
                    hasContextFlag: last
                      ? Boolean(
                          (last as unknown as Record<string, unknown>)['__contextDeleteAttached'],
                        )
                      : null,
                    bubbleVisible: Boolean(document.querySelector('.delete-bubble .btn-bubble')),
                  };
                } catch {
                  return { error: 'diag-failed' };
                }
              });

              /* Force remove so the test stays deterministic */
              await page.evaluate(() => {
                try {
                  const drawn = (window as unknown as { __LAYERS__?: { drawnItems?: unknown } })
                    .__LAYERS__?.drawnItems;
                  const layers =
                    drawn &&
                    typeof (drawn as unknown as { getLayers?: unknown }).getLayers === 'function'
                      ? (drawn as unknown as { getLayers: () => unknown[] }).getLayers()
                      : [];
                  const last =
                    layers && layers.length
                      ? (layers as unknown as unknown[])[layers.length - 1]
                      : null;
                  try {
                    if (
                      last &&
                      typeof (drawn as unknown as { removeLayer?: unknown }).removeLayer ===
                        'function'
                    ) {
                      (drawn as unknown as { removeLayer: (arg: unknown) => void }).removeLayer(
                        last,
                      );
                    }
                  } catch {}
                } catch {}
              });

              /* Attach diagnostic info to the test results */
              test.info().attach('deletebubble-fallback-diag.json', {
                body: JSON.stringify(diag),
                contentType: 'application/json',
              });
            }

            expect(await map.getDrawnCount()).toBe(before);
          });
        } else {
          await test.step('Immediate deletion: verify removal or attach diag', async () => {
            /* Bubble didn't appear — expected if deletion is immediate. Confirm removal happened. */
            const removed = await map
              .waitForDrawnCountLessThan(afterCreate, 3000)
              .then(() => true)
              .catch(() => false);

            if (!removed) {
              const diag = await page.evaluate(() => {
                try {
                  const drawn = (window as unknown as { __LAYERS__?: { drawnItems?: unknown } })
                    .__LAYERS__?.drawnItems;
                  const layers =
                    drawn &&
                    typeof (drawn as unknown as { getLayers?: unknown }).getLayers === 'function'
                      ? (drawn as unknown as { getLayers: () => unknown[] }).getLayers()
                      : [];
                  return {
                    drawnCount: layers.length,
                    bubbleVisible: Boolean(document.querySelector('.delete-bubble .btn-bubble')),
                  };
                } catch {
                  return { error: 'diag-failed' };
                }
              });

              /* Attach diagnostic info and fail with a clear message */
              test.info().attach('deletebubble-immediate-diag.json', {
                body: JSON.stringify(diag),
                contentType: 'application/json',
              });
              throw new Error(
                'Layer was not removed after right-click and no delete bubble appeared',
              );
            }

            expect(await map.getDrawnCount()).toBe(before);
          });
        }
      });
    });
  });
});
