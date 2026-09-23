// Opens the artwork full screen when its image is clicked or tapped. Click or tap the image to
// zoom in at that point and again to zoom out; drag with a mouse (or scroll, or swipe) to move
// around; Escape or Close to leave. The underlying link keeps working without JavaScript.
const trigger = document.querySelector<HTMLAnchorElement>('[data-viewer-open]');
const dialog = document.querySelector<HTMLDialogElement>('[data-viewer]');
const stage = dialog?.querySelector<HTMLElement>('[data-viewer-stage]');
const zoomButton = dialog?.querySelector<HTMLButtonElement>('[data-viewer-zoom]');
const closeButton = dialog?.querySelector<HTMLButtonElement>('[data-viewer-close]');
const pageImage = trigger?.querySelector('img');

if (trigger && dialog && stage && zoomButton && closeButton && pageImage && 'showModal' in dialog) {
  const fullUrl = trigger.href;
  const fullWidth = Number(trigger.dataset.width);
  const fullHeight = Number(trigger.dataset.height);
  let image: HTMLImageElement | undefined;
  let zoomed = false;
  let drag: { x: number; y: number; left: number; top: number; moved: boolean } | undefined;
  let suppressClick = false;

  const createImage = () => {
    const img = new Image(fullWidth, fullHeight);
    img.alt = pageImage.alt;
    img.draggable = false;
    img.decoding = 'async';
    // Start with the copy already on screen, then swap in the large file once it has loaded.
    img.src = pageImage.currentSrc || fullUrl;
    if (img.src !== fullUrl) {
      const large = new Image();
      large.src = fullUrl;
      large
        .decode()
        .then(() => (img.src = fullUrl))
        .catch(() => {});
    }
    stage.append(img);
    return img;
  };

  // Zoom in or out, keeping the point under the pointer (or the centre) where it is.
  const setZoom = (on: boolean, clientX?: number, clientY?: number) => {
    if (!image || on === zoomed) return;
    const box = image.getBoundingClientRect();
    const view = stage.getBoundingClientRect();
    const x = clientX ?? view.left + view.width / 2;
    const y = clientY ?? view.top + view.height / 2;
    const fx = Math.min(Math.max((x - box.left) / box.width, 0), 1);
    const fy = Math.min(Math.max((y - box.top) / box.height, 0), 1);

    zoomed = on;
    dialog.classList.toggle('is-zoomed', on);
    zoomButton.setAttribute('aria-pressed', String(on));
    stage.tabIndex = on ? 0 : -1;

    if (on) {
      stage.style.setProperty('--zoom-width', `${Math.round(Math.max(fullWidth, box.width * 2))}px`);
      stage.scrollLeft = image.offsetLeft + fx * image.offsetWidth - (x - view.left);
      stage.scrollTop = image.offsetTop + fy * image.offsetHeight - (y - view.top);
    } else {
      stage.style.removeProperty('--zoom-width');
    }
  };

  trigger.addEventListener('click', (event) => {
    // Let modified clicks (new tab, download) behave as normal links.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    image ??= createImage();
    dialog.showModal();
  });

  dialog.addEventListener('close', () => setZoom(false));

  closeButton.addEventListener('click', () => dialog.close());
  zoomButton.addEventListener('click', () => setZoom(!zoomed));

  stage.addEventListener('click', (event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (zoomed) setZoom(false);
    else if (event.target === image) setZoom(true, event.clientX, event.clientY);
    else dialog.close();
  });

  // Drag to pan with a mouse; touch and trackpads scroll the stage natively.
  stage.addEventListener('pointerdown', (event) => {
    suppressClick = false;
    if (!zoomed || event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop, moved: false };
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    stage.classList.add('is-dragging');
    stage.scrollLeft = drag.left - dx;
    stage.scrollTop = drag.top - dy;
  });

  const endDrag = () => {
    if (drag?.moved) suppressClick = true;
    drag = undefined;
    stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
}
