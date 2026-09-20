// ---------------------------------------------------------------------------
// Historical Crisis Cabinet — ვარდების რევოლუცია, ნოემბერი 2003.
//
// The only committee with a fixed roster. Every other committee builds its
// own the first time it signs in; this one is a historical cabinet, so the
// seats are the historical record and a chair shouldn't be picking them.
//
// Each seat is { code, name, role, photo }:
//   code  — only a fallback. If the portrait is missing or fails to load,
//           SeatAvatar falls back to this flag.
//   photo — a path under public/, so `/mun/hcc/x.jpg` resolves to
//           public/mun/hcc/x.jpg. Square-ish JPEGs; the largest render is
//           96px in roll call, so ~240×240 is plenty.
//
// Order is deliberate and matches the cabinet's own briefing: government
// first, then the opposition and the press, then the external actors.
//
// Wire it up in munData.js:
//
//   import { HCC_ROSTER } from './hccRoster';
//   ...
//   {
//     id: 'hcc',
//     seatKind: SEAT_KIND.FIGURE,
//     defaultTopic: 'Rose Revolution',
//     roster: HCC_ROSTER,
//     ...
//   }
//
// Note that useSessionEngine sorts the roster alphabetically by Georgian
// collation when it builds the session, so this order governs the roster
// setup screen rather than the running console.
// ---------------------------------------------------------------------------

const portrait = (slug) => `/mun/hcc/${slug}.jpg`;

export const HCC_ROSTER = [
  {
    code: 'ge',
    name: 'ედუარდ შევარდნაძე',
    role: 'საქართველოს პრეზიდენტი',
    photo: portrait('shevardnadze'),
  },
  {
    code: 'ge',
    name: 'ასლან აბაშიძე',
    role: 'აჭარის ავტონომიური რესპუბლიკის უზენაესი საბჭოს თავმჯდომარე, „დემოკრატიული აღორძინების კავშირის“ ლიდერი',
    photo: portrait('abashidze'),
  },
  {
    code: 'ge',
    name: 'ირაკლი ბათიაშვილი',
    role: 'საქართველოს საინფორმაციო-დაზვერვის სამსახურის ყოფილი უფროსი, „ოპოზიციონერი“ პოლიტიკოსი',
    photo: portrait('batiashvili'),
  },
  {
    code: 'ge',
    name: 'კობა ნარჩემაშვილი',
    role: 'საქართველოს შინაგან საქმეთა მინისტრი',
    photo: portrait('narchemashvili'),
  },
  {
    code: 'ge',
    name: 'ავთანდილ ჯორბენაძე',
    role: 'საქართველოს სახელმწიფო მინისტრი (მთავრობის მეთაური), ბლოკ „ახალი საქართველოსთვის“ ლიდერი',
    photo: portrait('jorbenadze'),
  },
  {
    code: 'ge',
    name: 'დავით თევზაძე',
    role: 'საქართველოს თავდაცვის მინისტრი',
    photo: portrait('tevzadze'),
  },
  {
    code: 'ge',
    name: 'მიხეილ სააკაშვილი',
    role: '„ერთიანი ნაციონალური მოძრაობის“ ლიდერი',
    photo: portrait('saakashvili'),
  },
  {
    code: 'ge',
    name: 'კობა დავითაშვილი',
    role: 'თბილისის საკრებულოს წევრი, „ნაციონალური მოძრაობის“ ერთ-ერთი ლიდერი და დამფუძნებელი',
    photo: portrait('davitashvili'),
  },
  {
    code: 'ge',
    name: 'ზურაბ ჟვანია',
    role: 'ბლოკ „ბურჯანაძე-დემოკრატების“ თანალიდერი, პარლამენტის ყოფილი თავმჯდომარე',
    photo: portrait('zhvania'),
  },
  {
    code: 'ge',
    name: 'ნინო ბურჯანაძე',
    role: 'საქართველოს პარლამენტის თავმჯდომარე, ოპოზიციური ბლოკის „ბურჯანაძე-დემოკრატები“ თანალიდერი',
    photo: portrait('burjanadze'),
  },
  {
    code: 'ge',
    name: 'ეროსი კიწმარიშვილი',
    role: 'ტელეკომპანია „რუსთავი 2“-ის დამფუძნებელი და მფლობელი',
    photo: portrait('kitsmarishvili'),
  },

  // --- the roles below were filled in; check them against your study guide
  {
    code: 'gb',
    name: 'ბრიუს ჯორჯი',
    role: 'ბრიტანეთის პარლამენტის წევრი, ეუთოს საპარლამენტო ასამბლეის საარჩევნო სადამკვირვებლო მისიის ხელმძღვანელი',
    photo: portrait('george'),
  },
  {
    code: 'ru',
    name: 'ვალერი ევნევიჩი',
    role: 'რუსეთის სახმელეთო ჯარების მთავარსარდლის მოადგილე სამშვიდობო ოპერაციების დარგში, გენერალ-ლეიტენანტი',
    photo: portrait('yevnevich'),
  },
  {
    code: 'ru',
    name: 'იგორ ივანოვი',
    role: 'რუსეთის ფედერაციის საგარეო საქმეთა მინისტრი',
    photo: portrait('ivanov'),
  },
  {
    code: '',
    name: 'მოძრაობა „კმარა“',
    role: 'სტუდენტური სამოქალაქო წინააღმდეგობის მოძრაობა',
    photo: portrait('kmara'),
  },
  {
    code: 'us',
    name: 'რიჩარდ მაილსი',
    role: 'ამერიკის შეერთებული შტატების ელჩი საქართველოში',
    photo: portrait('miles'),
  },
  {
    code: 'ch',
    name: 'ჰაიდი ტალიავინი',
    role: 'გაეროს გენერალური მდივნის სპეციალური წარმომადგენელი საქართველოში, UNOMIG-ის ხელმძღვანელი',
    photo: portrait('tagliavini'),
  },
  {
    code: 'ge',
    name: 'შალვა ნათელაშვილი',
    role: 'საქართველოს ლეიბორისტული პარტიის ლიდერი',
    photo: portrait('natelashvili'),
  },
  {
    code: 'ge',
    name: 'ჯემალ გოგიტიძე',
    role: 'აჭარის ავტონომიური რესპუბლიკის შინაგან საქმეთა მინისტრი, ასლან აბაშიძის უახლოესი მოკავშირე',
    photo: portrait('gogitidze'),
  },
];

// The slugs above, for whoever is collecting the portraits. Drop each as
// public/mun/hcc/<slug>.jpg — any that are missing fall back to the flag,
// so the cabinet still runs with a half-finished set.
export const HCC_PORTRAIT_SLUGS = HCC_ROSTER.map((seat) =>
  seat.photo.replace('/mun/hcc/', '').replace('.jpg', '')
);