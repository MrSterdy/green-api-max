export function bindViewportHeight(
  viewport: Pick<VisualViewport, 'height' | 'scale' | 'addEventListener' | 'removeEventListener'>,
  style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>,
) {
  function update() {
    if (viewport.scale === 1)
      style.setProperty('--viewport-height', `${viewport.height}px`)
    else
      style.removeProperty('--viewport-height')
  }

  update()
  viewport.addEventListener('resize', update)
  return () => {
    viewport.removeEventListener('resize', update)
    style.removeProperty('--viewport-height')
  }
}
