/* =====================================================================
   THE PRESENT TENSE – SITE CONTENT
   Edit this file to update campaigns, founders, sponsors, ambassadors,
   supporters and charities. You never need to touch index.html or script.js.

   Rules of thumb
   - Anything marked  placeholder: true  shows a clear "Placeholder" label on the page.
     Delete that line once the details are real and approved.
   - Photos/logos: put the file in an /images folder and write its path, e.g. "images/anna.jpg".
     Only use a photo once the person has given permission.
   - Website links must be the sponsor's/charity's OWN full address (https://…).
   ===================================================================== */

/* ---------- Ways to contribute (shared by every seasonal campaign; override per campaign with `ways`) ---------- */
const DEFAULT_WAYS = [
  { title: 'Donate', text: 'Give securely through our GoFundMe. Every contribution helps us buy, wrap and deliver gifts.', btn: 'Donate on GoFundMe', gofundme: true },
  { title: 'Drop off a gift', text: 'Donate items at one of our drop-off points. Locations will be announced; want your school, church or shop to be one?', btn: 'Offer a drop-off point', type: 'Drop-off point' },
  { title: 'Volunteer', text: 'Help us sort, wrap, organise and deliver. Volunteers under 18 need a parent or guardian\'s permission.', btn: 'Volunteer with us', type: 'Volunteering' },
  { title: 'Sponsor this campaign', text: 'Businesses and organisations can put their name behind a campaign.', btn: 'Become a sponsor', type: 'Sponsor or partner' },
  { title: 'Spread the word', text: 'Share this page with friends, family, your school or your congregation.', btn: 'Share on WhatsApp', share: true },
];

/* ---------- Seasonal campaigns: each one gets its own page at #campaign/<id> ----------
   needs:   [{ n: "Item", have: 0, goal: 50 }]   (leave [] until the list is confirmed)
   updates: [{ date: "2027-02-20", title: "…", text: "…" }]  (newest first; leave [] until there is news)
   theme:   pink | mint | sun | ink | sky   (gives each campaign its own colour identity) */
const CAMPAIGNS = [
  {
    id: 'valentines', name: "Valentine's Day", emoji: '💌', theme: 'pink', status: 'Planned for 2027',
    blurb: 'Spreading love and kindness to those who could use a little extra care.',
    about: [
      'Valentine\'s Day is about showing people they are cared for. But not everyone has someone to show it, or the means to mark the day. This campaign exists to spread love and kindness to people who could use a little extra care.',
      'It follows the idea behind everything The Present Tense does: giving shouldn\'t stop when the season ends, and a small, thoughtful gift can make a day feel special.',
    ],
    needs: [], updates: [],
  },
  {
    id: 'easter', name: 'Easter', emoji: '🐣', theme: 'mint', status: 'Planned for 2027',
    blurb: 'Helping families celebrate with a basket, a treat and a reason to smile.',
    about: [
      'Easter is a time for families to gather and celebrate. This campaign helps families who might otherwise go without by putting together a basket, a treat and a reason to smile.',
      'We want every family to be able to take part in the celebration, whatever their circumstances.',
    ],
    needs: [], updates: [],
  },
  {
    id: 'parents-day', name: "Mother's and Father's Day", emoji: '🌷', theme: 'sun', status: 'Planned',
    blurb: "Thank-you gifts for older people's homes and the parents and carers in our communities.",
    about: [
      'Mothers, fathers and carers give so much, often without being thanked. This campaign says thank you with gifts for older people\'s homes and for the parents and carers in our communities.',
      'It is a simple way to make sure the people who have looked after others feel looked after in return.',
    ],
    needs: [], updates: [],
  },
  {
    id: 'christmas', name: 'Christmas', emoji: '🎄', theme: 'ink', status: 'Planned for 2027',
    blurb: 'Making the festive season brighter, one present at a time.',
    about: [
      'The festive season should be bright for everyone. Through our Christmas campaign we collect, wrap and deliver presents so that more families can celebrate.',
      'Our Angel Tree, which matches supporters with gifts for individual children, is part of Christmas. Take a look at it if you would like to give to a specific child.',
    ],
    related: { label: 'See the Angel Tree', href: '#campaign/angel-tree' },
    needs: [], updates: [],
  },
  {
    id: 'angel-tree', name: 'Angel Tree', emoji: '👼', theme: 'sky', status: 'Christmas · Opening soon',
    blurb: 'A Christmas initiative: gifts for children who might otherwise go without.',
    about: [
      'The Angel Tree is a seasonal initiative that belongs to Christmas. Children who might otherwise go without are each given a card listing a few needs and a few wants, and supporters choose items from a card to cover.',
      'We only share a child\'s first name and age, never photos or surnames, and always with a parent or guardian\'s consent.',
    ],
    ways: [
      { title: 'Get notified', text: 'Leave your email and we\'ll tell you the moment children\'s cards open.', btn: 'Join the notify list', href: '#angel-tree' },
      { title: 'Choose a child\'s card', text: 'Once cards are published, pick a child and tick the items you would like to cover.', btn: 'Meet the children', href: '#kids' },
      { title: 'Pay for items or drop off a gift', text: 'Either we email you how to pay, or you drop your gift at the drop-off point shown on the card.' },
      { title: 'Volunteer or sponsor', text: 'Help us wrap and deliver, or put your organisation\'s name behind the Angel Tree.', btn: 'Get in touch', type: 'Angel Tree' },
      { title: 'Spread the word', text: 'Share this page so more children can be reached.', btn: 'Share on WhatsApp', share: true },
    ],
    needsNote: 'Each child\'s needs and wants are listed on their own card, with rough price ranges, so you can see exactly what would help.',
    needsLink: { label: 'Go to the children\'s cards', href: '#kids' },
    needs: [], updates: [],
  },
];

/* ---------- Founders (About us) ----------
   Equal prominence: the first two entries are shown side by side.
   Fill in: name, role, photo, intro, story paragraphs, and optionally a one-line quote. */
const FOUNDERS = [
  {
    name: 'Founder One', role: 'Role to be added', photo: '', placeholder: true, accent: 'pink',
    quote: 'A line in their own words will go here.',
    intro: 'Introduction and background to be added: who they are, where they are from and what they do day to day.',
    story: [
      'Their story to be added: what inspired them to start The Present Tense.',
      'Why they care about this initiative, and what they hope to achieve through it.',
    ],
  },
  {
    name: 'Founder Two', role: 'Role to be added', photo: '', placeholder: true, accent: 'sun',
    quote: 'A line in their own words will go here.',
    intro: 'Introduction and background to be added: who they are, where they are from and what they do day to day.',
    story: [
      'Their story to be added: what inspired them to start The Present Tense.',
      'Why they care about this initiative, and what they hope to achieve through it.',
    ],
  },
];

/* ---------- Sponsors and partners: each gets its own page at #sponsor/<id> ----------
   logo:   short text shown if there is no image;  image: path to the logo file
   website: the sponsor's OWN official address, e.g. "https://www.theirname.com"  (leave "" until confirmed) */
const SPONSORS = [
  { id: 'partner-one', name: 'Partner One', logo: 'P1', image: '', website: '', placeholder: true,
    about: 'Description of the organisation and what it does: to be supplied.',
    involvement: 'How the organisation came to be involved with The Present Tense: to be supplied.',
    contribution: 'The specific contribution or role it plays in supporting our initiatives: to be supplied.' },
  { id: 'partner-two', name: 'Partner Two', logo: 'P2', image: '', website: '', placeholder: true,
    about: 'Description of the organisation and what it does: to be supplied.',
    involvement: 'How the organisation came to be involved with The Present Tense: to be supplied.',
    contribution: 'The specific contribution or role it plays in supporting our initiatives: to be supplied.' },
  { id: 'partner-three', name: 'Partner Three', logo: 'P3', image: '', website: '', placeholder: true,
    about: 'Description of the organisation and what it does: to be supplied.',
    involvement: 'How the organisation came to be involved with The Present Tense: to be supplied.',
    contribution: 'The specific contribution or role it plays in supporting our initiatives: to be supplied.' },
  { id: 'partner-four', name: 'Partner Four', logo: 'P4', image: '', website: '', placeholder: true,
    about: 'Description of the organisation and what it does: to be supplied.',
    involvement: 'How the organisation came to be involved with The Present Tense: to be supplied.',
    contribution: 'The specific contribution or role it plays in supporting our initiatives: to be supplied.' },
];

/* ---------- Ambassadors ----------
   Only add someone once they have agreed to be listed. Photo only with their permission.
   name: their name or public handle;  link: their profile OR the post/video that featured us */
const AMBASSADORS = [
  { name: 'Ambassador name or @handle', photo: '', placeholder: true,
    about: 'A short description of how they have covered, promoted or supported The Present Tense.',
    link: '', linkLabel: 'View on social media' },
];

/* ---------- The Giving Wall (top supporters) ----------
   RULES: only add someone when (1) their contribution is VERIFIED and (2) they have given explicit permission.
   The page ignores any entry that is missing  verified: true  or  consent: true.
   - total:        verified total in Namibian dollars (a number)
   - displayName:  the name they chose to show
   - anonymous:    true = shown as "Anonymous supporter" (name and photo never shown)
   - showAmount:   true only if they agreed to show the amount (otherwise the rank is shown without it)
   - photo:        only if they voluntarily provided one and agreed to it being shown
   Example (delete the // to use):
   { displayName: "A. Supporter", total: 1500, anonymous: false, showAmount: true, photo: "", consent: true, verified: true }, */
const SUPPORTERS = [
];

/* ---------- Charities We Support ----------
   ONLY list charities we have actually supported or formally confirmed as beneficiaries.
   Example (delete the // to use):
   { id: "example-charity", name: "Charity name", logo: "", image: "images/charity.png",
     about: "Brief description of the organisation.",
     causes: "Primary causes and the communities it supports.",
     work: "The work it does.",
     support: "How The Present Tense supports or contributes to its work.",
     website: "https://official-site.org", contactUrl: "https://official-site.org/contact", contactEmail: "info@official-site.org", contactPhone: "" }, */
const CHARITIES = [
];
