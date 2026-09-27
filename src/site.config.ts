/**
 * Site settings.
 *
 * Every value written as [PLACEHOLDER: ...] is unknown and must be replaced before publishing.
 * README.md ("Filling in the placeholders") lists where each one appears.
 */

/** The artist name: header, gallery opening, About, footer, page titles, legal pages, link previews. */
const name = 'Kenning';

/**
 * The public email address, made from the name: contact@ followed by the name in lower case
 * (letters and digits only) and .co.uk, so "Example Name" gives contact@examplename.co.uk. It
 * only works once that domain is yours and its mailbox is set up: check both before publishing.
 * To use another address, replace everything after "const email =" with the address in quotes,
 * for example 'hello@example.co.uk'.
 */
const email = `contact@${name.normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`;

export const site = {
  name,

  /** One sentence shown by search engines and link previews. */
  description: '[PLACEHOLDER: one-sentence site description for search engines]',

  /** Shown on the Contact page. Web addresses must start with https:// */
  contact: {
    email,
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
    /** Who runs the website (Legal page), and how to reach them: the artist name and email. */
    identity: name,
    contact: email,
    /** Who is responsible for personal data (Privacy page), and how to reach them: the same. */
    controllerIdentity: name,
    controllerContact: email,
  },
};
