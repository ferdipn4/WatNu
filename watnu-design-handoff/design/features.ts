// WatNu feature flags — the single place that says what THIS build can do.
// Set every value from what the backend really provides before a release.
// live  = works as designed · local = works on this phone (localStorage), with a one-line hint
// soon  = visible in place, dashed + "Soon" tag, tapping shows the info Toast · off = not rendered at all
export type FeatureStatus = 'live' | 'local' | 'soon' | 'off';

export const features = {
  eventImages: 'live',    // the organizer's image on cards (16:9) and as the detail hero
  aiImport: 'live',       // upload → AI reads the poster (create step 2)
  pasteText: 'live',      // "Paste text instead" on step 1
  pdfUpload: 'soon',      // step 1 accepts images only until the backend reads PDFs ("PDF soon" in the copy)
  translation: 'live',    // the "Translated from Dutch" note on step 3
  conflictCheck: 'soon',  // step 4 "Busy slot" panel
  duplicateCheck: 'soon', // step 4 "Possible duplicate" panel
  suggestions: 'soon',    // step 4 "Wednesday is quieter" panel
  save: 'local',          // bookmark → localStorage, mirrored on My WatNu
  follow: 'local',        // follow → localStorage
  calendarExport: 'soon', // "Add to calendar" (.ics) on the detail screen
  share: 'live',          // native share sheet / copy link
  promoCodes: 'soon',     // the promo card + QR sheet on the detail screen, the 10% off tag
  organizerStats: 'soon', // the stats card on the organizer profile
  search: 'live',         // the organizer directory search
} as const satisfies Record<string, FeatureStatus>;

export type FeatureKey = keyof typeof features;
export const isLive = (k: FeatureKey) => features[k] === 'live' || features[k] === 'local';
export const isSoon = (k: FeatureKey) => features[k] === 'soon';
export const isOff = (k: FeatureKey) => features[k] === 'off';
