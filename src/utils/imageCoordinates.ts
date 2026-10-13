/**
 * Utility for calculating exact pixel and percentage coordinates
 * for images rendered with `object-fit: contain`.
 * Accounts for letterbox/pillarbox offsets.
 */

export interface RenderedImageBounds {
  renderedWidth: number;
  renderedHeight: number;
  offsetX: number;
  offsetY: number;
  rect: DOMRect;
  renderedLeft: number;
  renderedTop: number;
  renderedRight: number;
  renderedBottom: number;
}

export interface PercentagePoint {
  x: number; // 0 ~ 100
  y: number; // 0 ~ 100
}

export interface RelativePoint {
  x: number; // pixel relative to image container
  y: number; // pixel relative to image container
}

/**
 * Calculates the exact rendered bounds of an image inside an `object-fit: contain` img element.
 */
export function getRenderedImageBounds(img: HTMLImageElement | null): RenderedImageBounds | null {
  if (!img) return null;

  const rect = img.getBoundingClientRect();
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;

  if (!naturalWidth || !naturalHeight || rect.width === 0 || rect.height === 0) {
    return null;
  }

  const containerWidth = rect.width;
  const containerHeight = rect.height;

  const naturalAspect = naturalWidth / naturalHeight;
  const containerAspect = containerWidth / containerHeight;

  let renderedWidth: number;
  let renderedHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (containerAspect > naturalAspect) {
    // Container is wider than the image: Pillarboxing (margins on left and right)
    renderedHeight = containerHeight;
    renderedWidth = containerHeight * naturalAspect;
    offsetX = (containerWidth - renderedWidth) / 2;
    offsetY = 0;
  } else {
    // Container is taller than the image: Letterboxing (margins on top and bottom)
    renderedWidth = containerWidth;
    renderedHeight = containerWidth / naturalAspect;
    offsetX = 0;
    offsetY = (containerHeight - renderedHeight) / 2;
  }

  const renderedLeft = rect.left + offsetX;
  const renderedTop = rect.top + offsetY;

  return {
    renderedWidth,
    renderedHeight,
    offsetX,
    offsetY,
    rect,
    renderedLeft,
    renderedTop,
    renderedRight: renderedLeft + renderedWidth,
    renderedBottom: renderedTop + renderedHeight,
  };
}

/**
 * Converts mouse/touch client coordinates (e.g. event.clientX, event.clientY)
 * to 0 ~ 100 percentage coordinates within the actual rendered image area.
 * Returns null if clicked outside the actual image (in the letterbox area).
 */
export function clientPointToImagePercent(
  clientX: number,
  clientY: number,
  img: HTMLImageElement | null
): PercentagePoint | null {
  const bounds = getRenderedImageBounds(img);
  if (!bounds) return null;

  const { renderedLeft, renderedTop, renderedRight, renderedBottom, renderedWidth, renderedHeight } = bounds;

  // Check if click is outside the actual rendered image
  if (
    clientX < renderedLeft ||
    clientX > renderedRight ||
    clientY < renderedTop ||
    clientY > renderedBottom
  ) {
    return null;
  }

  const pxFromLeft = clientX - renderedLeft;
  const pxFromTop = clientY - renderedTop;

  const percentX = Math.min(100, Math.max(0, (pxFromLeft / renderedWidth) * 100));
  const percentY = Math.min(100, Math.max(0, (pxFromTop / renderedHeight) * 100));

  return {
    x: Number(percentX.toFixed(2)),
    y: Number(percentY.toFixed(2)),
  };
}

/**
 * Converts a 0 ~ 100 image percentage point into pixel coordinates
 * relative to the container of the img element.
 */
export function imagePercentToScreenPoint(
  percentX: number,
  percentY: number,
  img: HTMLImageElement | null
): RelativePoint | null {
  const bounds = getRenderedImageBounds(img);
  if (!bounds) return null;

  const { offsetX, offsetY, renderedWidth, renderedHeight } = bounds;

  return {
    x: offsetX + (percentX / 100) * renderedWidth,
    y: offsetY + (percentY / 100) * renderedHeight,
  };
}
