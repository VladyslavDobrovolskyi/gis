export function initGeomanToolbarCleanup(): void {
  try {
    const removeRotateControls = () => {
      const toolbar =
        document.querySelector('.leaflet-pm-toolbar') || document.querySelector('.leaflet-buttons');
      if (!toolbar) return;

      toolbar
        .querySelectorAll('.leaflet-pm-icon-rotate, .control-icon.leaflet-pm-icon-rotate')
        .forEach((el) => {
          const container =
            (el as HTMLElement).closest('.button-container') || (el as HTMLElement).parentElement;
          if (container) container.remove();
          else (el as HTMLElement).remove();
        });

      toolbar
        .querySelectorAll(
          '.leaflet-pm-icon-remove, .leaflet-pm-icon-delete, .leaflet-pm-icon-trash, .leaflet-pm-icon-removal, .control-icon.leaflet-pm-icon-remove',
        )
        .forEach((el) => {
          const container =
            (el as HTMLElement).closest('.button-container') || (el as HTMLElement).parentElement;
          if (container) container.remove();
          else (el as HTMLElement).remove();
        });

      toolbar.querySelectorAll('.button-container').forEach((el) => {
        try {
          const title = (el as HTMLElement).getAttribute('title') || '';
          const t = title.toLowerCase();
          if (
            t.includes('поворот') ||
            t.includes('удал') ||
            t.includes('удалить') ||
            t.includes('remove') ||
            t.includes('delete') ||
            t.includes('trash')
          )
            (el as HTMLElement).remove();
        } catch {}
      });

      toolbar.querySelectorAll('.leaflet-pm-action').forEach((el) => {
        try {
          const title = (el as HTMLElement).getAttribute('title') || '';
          const t = title.toLowerCase();
          if (
            t.includes('поворот') ||
            t.includes('удал') ||
            t.includes('delete') ||
            t.includes('remove') ||
            t.includes('trash')
          )
            (el as HTMLElement).remove();
        } catch {}
      });
    };

    setTimeout(removeRotateControls, 200);
    const toolbarNode =
      document.querySelector('.leaflet-pm-toolbar') || document.querySelector('.leaflet-buttons');
    if (toolbarNode && typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(removeRotateControls);
      obs.observe(toolbarNode, { childList: true, subtree: true });
    }
  } catch {
    /* ignore */
  }
}
