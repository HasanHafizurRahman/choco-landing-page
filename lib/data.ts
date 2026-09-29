import type { ShopData } from './types';

/**
 * Mock shop data for the static prototype. Replace with the API response later
 * (lib/api.ts is the only place that reads this file).
 */
export const shopData: ShopData = {
  brand: {
    name: 'ritu',
    nameBn: 'ঋতু',
    tagline: 'Chocolate, always. The rest, in season.',
    currency: '৳',
    phone: '+880 1700-000000',
    city: 'Dhaka, Bangladesh',
    links: { facebook: '#', instagram: '#', whatsapp: '#' },
  },

  delivery: {
    freeOver: 2000, // inside Dhaka
    zones: [
      { id: 'dhaka', label: 'Inside Dhaka', fee: 70, eta: 'within 24 hours' },
      { id: 'outside', label: 'Outside Dhaka', fee: 130, eta: 'in 2–4 days' },
    ],
  },

  payments: [
    { id: 'cod', label: 'Cash on delivery' },
    { id: 'bkash', label: 'bKash' },
    { id: 'nagad', label: 'Nagad' },
    { id: 'card', label: 'Card' },
  ],

  // Bangladesh's six seasons (revised Bengali calendar). When no seasonal
  // collection is live, the current one sets the site's colours.
  seasons: [
    { id: 'grishma', name: 'Grishma', bn: 'গ্রীষ্ম', en: 'summer', months: 'Boishakh – Joishtho', from: '04-14', to: '06-14',
      note: 'Mango season opens in late May. Gopalbhog comes first, then Himsagar.',
      theme: { accent: '#FFB020', deep: '#9A4700', soft: '#FFF5DF', glow: '#FFB547' } },
    { id: 'borsha', name: 'Borsha', bn: 'বর্ষা', en: 'monsoon', months: 'Asharh – Srabon', from: '06-15', to: '08-15',
      note: 'Langra, Amrapali and Fazli arrive with the rain.',
      theme: { accent: '#5BC28A', deep: '#1B6441', soft: '#ECF6F0', glow: '#5FD699' } },
    { id: 'shorot', name: 'Shorot', bn: 'শরৎ', en: 'autumn', months: 'Bhadro – Ashwin', from: '08-16', to: '10-16',
      note: 'Blue skies, cooler nights, and chocolate that travels well again.',
      theme: { accent: '#72BCF2', deep: '#1D5A92', soft: '#EEF6FD', glow: '#7CC6FF' } },
    { id: 'hemonto', name: 'Hemonto', bn: 'হেমন্ত', en: 'late autumn', months: 'Kartik – Ogrohayon', from: '10-17', to: '12-15',
      note: 'Harvest time in the fields. Chocolate, as always.',
      theme: { accent: '#DCC050', deep: '#675410', soft: '#F8F5E3', glow: '#EACB5C' } },
    { id: 'sheet', name: 'Sheet', bn: 'শীত', en: 'winter', months: 'Poush – Magh', from: '12-16', to: '02-13',
      note: 'The best months for chocolate. Gift boxes open on 1 February.',
      theme: { accent: '#B3BCEE', deep: '#3C4889', soft: '#F3F4FC', glow: '#A8B5FF' } },
    { id: 'boshonto', name: 'Boshonto', bn: 'বসন্ত', en: 'spring', months: 'Falgun – Choitro', from: '02-14', to: '04-13',
      note: 'Falgun and Valentine’s share a day: 14 February.',
      theme: { accent: '#FF6F84', deep: '#A8163A', soft: '#FFF1F2', glow: '#FF7088' } },
  ],

  collections: [
    {
      id: 'premium', kind: 'core', title: 'Premium chocolate', tabSub: 'All year round',
      shopTitle: 'On the shelf, all year.',
    },
    {
      id: 'mango', kind: 'seasonal', status: 'auto', from: '05-20', to: '08-20', theme: 'grishma',
      title: 'Mango season', short: 'Mangoes', bn: 'মধুমাস',
      shopTitle: 'Mangoes, while they last.',
      hero: { now: 'Mangoes, right now.', next: 'Mangoes, from May.' },
      sub: { now: 'This season: tree-ripened mangoes from Rajshahi.', next: 'Next season: Rajshahi mangoes, from late May.' },
      cta: { now: 'Mangoes are in', next: 'Mangoes · from 20 May' },
      poster: {
        layout: 'harvest',
        eyebrow: 'Modhumash, the honey months',
        title: 'Picked ripe in Rajshahi. At your door in two days.',
        body: 'We buy straight from orchards in Rajshahi and Chapainawabganj and pick each variety when it’s ready, never early. No carbide, no formalin. Crates are ventilated, so nothing sweats on the way.',
        cta: 'Shop all mangoes',
      },
      closedNote: 'Mango season wrapped up on 20 August.',
    },
    {
      id: 'gifts', kind: 'seasonal', status: 'auto', from: '02-01', to: '02-14', theme: 'boshonto',
      title: 'Gift boxes', short: 'Gift boxes', bn: '১৪', countdownTo: '02-14',
      announce: 'Order gift boxes by 12 February for delivery on the 14th, anywhere inside Dhaka.',
      shopTitle: 'Gift boxes for the 14th.',
      hero: { now: 'Gift boxes, right now.', next: 'Gift boxes, from 1 Feb.' },
      sub: { now: 'This season: gift boxes for Falgun and Valentine’s.', next: 'Next season: gift boxes, opening 1 February.' },
      cta: { now: 'Gift boxes are in', next: 'Gift boxes · from 1 Feb' },
      poster: {
        layout: 'countdown',
        eyebrow: 'Falgun & Valentine’s · 14 February',
        title: 'Say it with a box.',
        body: 'Hand-packed boxes of the good stuff, with a note in your words written on a card. Order by 12 February and we’ll deliver on the 14th, anywhere inside Dhaka.',
        cta: 'Shop gift boxes',
      },
      closedNote: 'Gift boxes ran until 14 February.',
    },
  ],

  categories: [
    { id: 'dark', label: 'Dark', swatch: '#2B1810' },
    { id: 'milk', label: 'Milk', swatch: '#8A5634' },
  ],

  products: [
    // ── Premium chocolate (all year) ──────────────────────────
    { id: 'lindt-70', collection: 'premium', category: 'dark', brand: 'Lindt', origin: 'Switzerland',
      name: 'Excellence 70% Cocoa', size: '100 g', cocoa: 70, price: 790, bestBefore: '2027-09', tag: 'Best seller',
      image: '/images/products/lindt-excellence-70.jpg',
      description: 'Smooth for its strength, with a long, clean finish. The easiest first step into serious dark chocolate.' },
    { id: 'soothys-90', collection: 'premium', category: 'dark', brand: 'Soothys', origin: 'India',
      name: '90% Dark, sweetened with dates', size: '80 g', cocoa: 90, price: 650, bestBefore: '2027-07',
      image: '/images/products/soothys-90-dates.jpg',
      description: 'Single-origin cocoa from Andhra Pradesh, sweetened only with dates. Bold, fruity and not for the faint-hearted.' },
    { id: 'lindt-85-carton', collection: 'premium', category: 'dark', brand: 'Lindt', origin: 'Switzerland',
      name: 'Excellence 85% Cocoa, carton', size: '12 × 100 g', cocoa: 85, price: 9200, bestBefore: '2027-08', tag: 'Bulk',
      image: '/images/products/lindt-excellence-85-carton.jpg',
      description: 'Twelve bars of the deeper, drier 85%. For office pantries, hampers, or anyone who eats a bar a week.' },
    { id: 'amul-dark', collection: 'premium', category: 'dark', brand: 'Amul', origin: 'India',
      name: 'Dark Chocolate', size: '150 g', cocoa: 55, price: 320, bestBefore: '2027-06',
      image: '/images/products/amul-dark.jpg',
      description: 'An everyday dark bar: mellow, not bitter, and easy to share.' },
    { id: 'lindt-extra-creamy', collection: 'premium', category: 'milk', brand: 'Lindt', origin: 'Switzerland',
      name: 'Excellence Extra Creamy Milk', size: '100 g', price: 790, bestBefore: '2027-08',
      image: '/images/products/lindt-extra-creamy.jpg',
      description: 'Swiss milk chocolate with extra cream. It melts slowly and tastes a little of caramel.' },
    { id: 'cadbury-silk', collection: 'premium', category: 'milk', brand: 'Cadbury', origin: 'India',
      name: 'Dairy Milk Silk', size: '60 g', price: 260, bestBefore: '2027-06', tag: 'Most gifted',
      image: '/images/products/cadbury-silk.jpg',
      description: 'The smoothest bar in the Dairy Milk family, and the one everyone asks for.' },
    { id: 'ferrero-bar', collection: 'premium', category: 'milk', brand: 'Ferrero Rocher', origin: 'Italy',
      name: 'Milk Chocolate & Hazelnut Bar', size: '90 g', price: 720, bestBefore: '2027-07', tag: 'New',
      image: '/images/products/ferrero-rocher-bar.jpg',
      description: 'The famous gold ball as a bar: milk chocolate, hazelnut filling and crunchy hazelnut pieces.' },
    { id: 'nutri-velvet', collection: 'premium', category: 'milk', brand: 'Nutri+', origin: 'Local',
      name: 'Velvet Creamy Milk', size: '20 g', price: 60, bestBefore: '2027-06',
      image: '/images/products/nutri-velvet.jpg',
      description: 'A creamy local favourite at a pocket-money price.' },

    // ── Mango season ──────────────────────────────────────────
    { id: 'gopalbhog', collection: 'mango', category: 'mango', brand: 'Rajshahi', origin: 'Bangladesh',
      name: 'Gopalbhog', from: '05-20', to: '06-15',
      variants: [{ id: '5kg', label: '5 kg', price: 850 }, { id: '10kg', label: '10 kg', price: 1600 }],
      image: '/images/products/mango-gopalbhog.jpg',
      description: 'The first mango of the year. Small, fiberless and very sweet, with a short season.' },
    { id: 'himsagar', collection: 'mango', category: 'mango', brand: 'Chapainawabganj', origin: 'Bangladesh',
      name: 'Himsagar', aka: 'Khirsapat', from: '05-28', to: '06-30', tag: 'Favourite',
      variants: [{ id: '5kg', label: '5 kg', price: 950 }, { id: '10kg', label: '10 kg', price: 1800 }],
      image: '/images/products/mango-himsagar.jpg',
      description: 'Honey-sweet, fragrant and almost fiberless. For many people, the best mango of the year.' },
    { id: 'langra', collection: 'mango', category: 'mango', brand: 'Rajshahi', origin: 'Bangladesh',
      name: 'Langra', from: '06-08', to: '07-10',
      variants: [{ id: '5kg', label: '5 kg', price: 850 }, { id: '10kg', label: '10 kg', price: 1600 }],
      image: '/images/products/mango-langra.jpg',
      description: 'Stays green even when ripe. Juicy, with a gentle tang under the sweetness.' },
    { id: 'amrapali', collection: 'mango', category: 'mango', brand: 'Rajshahi', origin: 'Bangladesh',
      name: 'Amrapali', from: '06-20', to: '07-31',
      variants: [{ id: '5kg', label: '5 kg', price: 950 }, { id: '10kg', label: '10 kg', price: 1800 }],
      image: '/images/products/mango-amrapali.jpg',
      description: 'Deep orange flesh and the sweetest of the lot. Small fruit, big flavour.' },
    { id: 'fazli', collection: 'mango', category: 'mango', brand: 'Rajshahi', origin: 'Bangladesh',
      name: 'Fazli', from: '07-01', to: '08-20',
      variants: [{ id: '5kg', label: '5 kg', price: 750 }, { id: '10kg', label: '10 kg', price: 1400 }],
      image: '/images/products/mango-fazli.jpg',
      description: 'The big late-season mango. Firm, mildly sweet and perfect for slicing.' },

    // ── Gift boxes (Falgun & Valentine's) ─────────────────────
    { id: 'heart-ferrero', collection: 'gifts', category: 'gift', brand: 'Hand-packed', origin: 'Dhaka',
      name: 'Heart box, Ferrero Rocher & roses', size: '16 pieces · 7 keepsake roses', price: 3450, tag: 'Most loved',
      image: '/images/products/gift-heart-ferrero.jpg', fit: 'cover',
      description: 'Sixteen Ferrero Rocher and seven keepsake roses in a heart-shaped box with a satin bow.' },
    { id: 'ribbon-hamper', collection: 'gifts', category: 'gift', brand: 'Hand-packed', origin: 'Dhaka',
      name: 'The red ribbon hamper', size: 'Chocolate & small treats', price: 4800,
      image: '/images/products/gift-red-ribbon-hamper.jpg', fit: 'cover',
      description: 'A kraft keepsake box tied with red satin, filled with chocolate and small treats on a bed of crinkle paper.' },
    { id: 'little-ones', collection: 'gifts', category: 'gift', brand: 'Hand-packed', origin: 'Dhaka',
      name: 'Little ones’ box, Kinder & Nutella', size: 'For kids · 8 treats', price: 2650,
      image: '/images/products/gift-little-ones.jpg', fit: 'cover',
      description: 'Nutella, Kinder Joy, Kinder Bueno and friends in a wooden crate. The easiest way to be someone’s favourite.' },
  ],

  faq: [
    { q: 'How much is delivery?', a: '৳70 inside Dhaka and ৳130 everywhere else. Orders over ৳2,000 ship free inside Dhaka.' },
    { q: 'Will my chocolate arrive melted?', a: 'No. From March to October every order goes in an insulated box with ice packs, and our riders drop chocolate orders first.' },
    { q: 'How does mango pre-booking work?', a: 'Choose a variety that isn’t ripe yet and book a crate. We ship the week it’s harvested, and you pay on delivery.' },
    { q: 'Can I send a gift straight to someone?', a: 'Yes. Enter their address at checkout and add a note. We’ll write it on a card and leave the price out of the box.' },
    { q: 'Are these the real thing?', a: 'Every bar comes from authorised importers, and the best-before date on each listing is the one printed on the pack we’ll send you.' },
  ],
};
