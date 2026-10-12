export const SECTION_IDS = Object.freeze([
  'home',
  'about',
  'projects',
  'journey',
  'skills',
  'contact',
]);

export const SECTION_NAV = Object.freeze(
  SECTION_IDS.map((id) => Object.freeze({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    href: `#${id}`,
  })),
);

/** Recognize section fragments without treating arbitrary anchors as Home. */
export function knownSectionHash(hash, supportedSections = SECTION_IDS) {
  try {
    const value = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase();
    return SECTION_IDS.includes(value) &&
      (value === 'home' || supportedSections.includes(value)) ? value : null;
  } catch {
    return null;
  }
}

export function parseSectionHash(hash = '', supportedSections = SECTION_IDS) {
  return knownSectionHash(hash, supportedSections) ?? 'home';
}

/** Keep a bare initial URL bare; normalize other fragments to a known section. */
export function canonicalSectionHash(hash = '', supportedSections = SECTION_IDS) {
  return !hash || hash === '#' ? '' : `#${parseSectionHash(hash, supportedSections)}`;
}

export function sectionUrl(currentHref, section) {
  const url = new URL(currentHref);
  return `${url.pathname}${url.search}#${section}`;
}

/** Only intercept actual section links in this document. */
export function sectionLinkTarget(href, currentHref, supportedSections = SECTION_IDS) {
  try {
    const current = new URL(currentHref);
    const target = new URL(href, current);
    if (
      target.origin !== current.origin ||
      target.pathname !== current.pathname ||
      target.search !== current.search
    ) return null;
    return knownSectionHash(target.hash, supportedSections);
  } catch {
    return null;
  }
}
