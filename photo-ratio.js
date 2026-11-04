/* Keep each square photo in the editorial sheet proportional inside its frame. */
(() => {
  const observer = new ResizeObserver(entries => {
    for (const { target, contentRect } of entries) {
      const { width, height } = contentRect;
      if (!width || !height) continue;
      const side = Math.max(width, height);
      const { column, row } = frames.get(target);
      target.style.backgroundSize = `${side * 3}px ${side * 2}px`;
      target.style.backgroundPosition = `${-(column * side + (side - width) / 2)}px ${-(row * side + (side - height) / 2)}px`;
    }
  });
  const frames = new WeakMap();
  document.querySelectorAll('.tile, .fictional-image, .photo, .image').forEach(photo => {
    const style = getComputedStyle(photo);
    if (style.backgroundSize !== '300% 200%') return;
    const position = style.backgroundPosition.split(/\s+/);
    frames.set(photo, { column: parseFloat(position[0]) / 50, row: parseFloat(position[1]) / 100 });
    observer.observe(photo);
  });
})();