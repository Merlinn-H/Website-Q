/**
 * Site settings.
 *
 * Every value written as [PLACEHOLDER: ...] is unknown and must be replaced before publishing.
 * README.md ("Filling in the placeholders") lists where each one appears.
 */
export const site = {
  /** The artist name: header, gallery opening, footer and page titles. */
  name: 'Kenning',

  /** One sentence shown by search engines and link previews. */
  description: '[PLACEHOLDER: one-sentence site description for search engines]',

  /** Shown on the Contact page. Web addresses must start with https:// */
  contact: {
    email: '[PLACEHOLDER: contact email]',
    etsyShopUrl: '[PLACEHOLDER: Etsy shop URL]',
    printsUrl: '[PLACEHOLDER: Gelato prints URL]',
  },

  /** Used on the Privacy, Cookies and Legal pages. */
  legal: {
    /**
     * Shows "Template: to be reviewed before publication." at the top of the three legal pages.
     * Change to false once the pages have been reviewed.
     */
    showTemplateBanner: true,
    identity: '[PLACEHOLDER: trading name / legal identity]',
    contact: '[PLACEHOLDER: contact]',
    controllerIdentity: '[PLACEHOLDER: data controller name / legal identity]',
    controllerContact: '[PLACEHOLDER: data controller contact details]',
  },
};
