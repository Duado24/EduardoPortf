import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SECTION_IDS,
  SECTION_NAV,
  canonicalSectionHash,
  parseSectionHash,
  sectionLinkTarget,
  sectionUrl,
} from '../src/lib/sections.js';

test('all six sections provide genuine, distinct hash links', () => {
  assert.equal(new Set(SECTION_IDS).size, 6);
  assert.deepEqual(SECTION_NAV.map(({ href }) => parseSectionHash(href)), SECTION_IDS);
});

test('initial hashes accept legacy casing and encoded section names', () => {
  assert.equal(parseSectionHash('#Projects'), 'projects');
  assert.equal(parseSectionHash('#%61bout'), 'about');
  assert.equal(canonicalSectionHash('#CONTACT'), '#contact');
});

test('missing, unknown, and malformed fragments safely resolve to Home', () => {
  assert.equal(parseSectionHash(), 'home');
  assert.equal(parseSectionHash('#unknown'), 'home');
  assert.equal(parseSectionHash('#%broken'), 'home');
  assert.equal(canonicalSectionHash('#unknown'), '#home');
  assert.equal(canonicalSectionHash(''), '');
});

test('navigation URLs preserve the GitHub Pages base path and query', () => {
  assert.equal(
    sectionUrl('https://example.test/EduardoPortf/?preview=1#about', 'projects'),
    '/EduardoPortf/?preview=1#projects',
  );
});

test('only known links to the same document are intercepted', () => {
  const current = 'https://example.test/EduardoPortf/?preview=1#home';
  assert.equal(sectionLinkTarget('#Projects', current), 'projects');
  assert.equal(sectionLinkTarget('/EduardoPortf/?preview=1#skills', current), 'skills');
  assert.equal(sectionLinkTarget('#section-heading', current), null);
  assert.equal(sectionLinkTarget('#', current), null);
  assert.equal(sectionLinkTarget('https://other.test/EduardoPortf/?preview=1#about', current), null);
  assert.equal(sectionLinkTarget('/other/?preview=1#about', current), null);
  assert.equal(sectionLinkTarget('/EduardoPortf/?preview=2#about', current), null);
  assert.equal(sectionLinkTarget('mailto:hello@example.test', current), null);
});

test('optional route restrictions reject unsupported deep links before rendering', () => {
  const supported = ['home', 'about'];
  assert.equal(parseSectionHash('#About', supported), 'about');
  assert.equal(canonicalSectionHash('#About', supported), '#about');
  for (const section of ['projects', 'journey', 'skills', 'contact']) {
    assert.equal(parseSectionHash(`#${section}`, supported), 'home');
    assert.equal(canonicalSectionHash(`#${section}`, supported), '#home');
  }
  assert.equal(canonicalSectionHash('', supported), '');
});

test('optional route restrictions only intercept enabled destinations', () => {
  const supported = ['home', 'about'];
  const current = 'https://example.test/EduardoPortf/#home';
  assert.equal(sectionLinkTarget('#about', current, supported), 'about');
  assert.equal(sectionLinkTarget('#home', current, supported), 'home');
  assert.equal(sectionLinkTarget('#projects', current, supported), null);
});
