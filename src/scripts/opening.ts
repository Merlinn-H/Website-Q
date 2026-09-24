// The gallery's staged opening (see index.astro), on a first look at it only: BaseLayout.astro
// marks the page with html[data-opening] before it is shown. As soon as the visitor shows they
// want to move on (scrolling, touching, clicking, a key), the rest plays quickly. Once every step
// has played, the mark is removed, which leaves the page exactly as it is at rest.

const root = document.documentElement;

if (root.hasAttribute('data-opening')) {
  const steps = () =>
    document
      .getAnimations()
      .filter(
        (animation): animation is CSSAnimation =>
          animation instanceof CSSAnimation && animation.animationName.startsWith('opening-'),
      );
  const signs = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'scroll'];
  const stopListening = () => {
    for (const sign of signs) removeEventListener(sign, hurry);
  };
  function hurry() {
    for (const step of steps()) step.updatePlaybackRate(8);
    stopListening();
  }

  for (const sign of signs) addEventListener(sign, hurry, { passive: true });
  Promise.allSettled(steps().map((step) => step.finished)).then(() => {
    stopListening();
    root.removeAttribute('data-opening');
  });
}
