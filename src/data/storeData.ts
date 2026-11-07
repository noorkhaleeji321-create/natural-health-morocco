import { HeroSlide, Category, Product, Seller, StoreEntity } from '../types';

export const initialHeroSlides: HeroSlide[] = [
  {
    id: 'slide-1',
    title: 'عطارة مغربية أصيلة',
    subtitle: 'من قلب الأسواق العريقة',
    tag: 'طبيعي 100%',
    image: '/assets/images/hero_spices_1793739545710.jpg',
    badge: 'جودة ملكية',
    ctaText: 'تسوق الآن',
    ctaTarget: '#best-sellers',
  },
  {
    id: 'slide-2',
    title: 'بخور وعطور ملكية',
    subtitle: 'روائح تأخذك لعالم آخر',
    tag: 'عطور فاخرة',
    image: '/assets/images/hero_perfume_1793739561627.jpg',
    badge: 'أصالة وتميز',
    ctaText: 'اكتشف المزيد',
    ctaTarget: '#categories',
  },
  {
    id: 'slide-3',
    title: 'منصة العطارين',
    subtitle: 'طبيعة وجودة في مكان واحد',
    tag: 'جودة مضمونة',
    image: '/assets/images/hero_banner_1793739575199.jpg',
    badge: 'خدمة متميزة',
    ctaText: 'اطلب الآن',
    ctaTarget: '#best-sellers',
  },
  {
    id: 'slide-4',
    title: 'عسل حر وأعشاب برية',
    subtitle: 'كنوز جبال الأطلس',
    tag: 'منتجات طبيعية',
    image: '/assets/images/hero_honey_tea_1793739587352.jpg',
    badge: 'من الطبيعة إليك',
    ctaText: 'تسوق الآن',
    ctaTarget: '#new-arrivals',
  },
  {
    id: 'slide-5',
    title: 'تمور وفواكه جافة',
    subtitle: 'طاقة وحيوية طبيعية',
    tag: 'فواكه مختارة',
    image: '/assets/images/hero_dates_honey_1793739602965.jpg',
    badge: 'صحي ولذيذ',
    ctaText: 'اكتشف',
    ctaTarget: '#categories',
  }
];

export const categories: Category[] = [];
export const allProducts: Product[] = [];
export const defaultSellers: Seller[] = [];
export const defaultStores: StoreEntity[] = [];
export const bestSellerProducts: Product[] = [];
export const newProducts: Product[] = [];

export const storeInfo = {
  name: 'natural-morocco',
  tagline: 'منتجات وزيوت وأعشاب طبيعية صحراوية ومراهم أصلية 100%',
  since: '2020',
  address: 'المملكة المغربية - التوصيل متوفر لجميع المدن',
  city: 'التوصيل متوفر لجميع مدن المغرب',
  phone: '+212 7 75 04 46 15',
  whatsapp: '+212 7 75 04 46 15',
  email: 'aiwebcraft6@gmail.com',
  hours: 'يومياً من 9:00 صباحاً حتى 10:00 مساءً',
  instagram: 'https://instagram.com/natural_morocco',
  facebook: 'https://facebook.com/naturalmorocco',
  guarantees: [
    { title: 'أصلي 100%', desc: 'منتجات طبيعية ومراهم أصلية مفحوصة بدون أي مواد ضارة' },
    { title: 'دفع عند الاستلام', desc: 'عاين طلبيتك وتأكد منها قبل دفع أي درهم' },
    { title: 'توصيل لجميع المدن', desc: 'خدمة توصيل سريعة ومحكمة لجميع أرجاء المملكة المغربية' },
    { title: 'خدمة الزبناء المباشرة', desc: 'تواصل مباشر عبر الواتساب للإرشاد والمتابعة' },
  ]
};

export const storeBankInfo = {
  bankName: 'التجاري وفا بنك (Attijariwafa Bank)',
  accountHolder: 'natural-morocco',
  rib: '007 780 0001234567890123 45',
  ribClean: '007780000123456789012345',
  agency: 'المملكة المغربية',
  swift: 'BCMAMAMC'
};
