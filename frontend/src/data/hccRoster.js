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
    name: 'მიხეილ სააკაშვილი',
    role: '„ერთიანი ნაციონალური მოძრაობის“ ლიდერი',
    photo: portrait('saakashvili'),
  },
  {
    code: 'ge',
    name: 'ნინო ბურჯანაძე',
    role: 'საქართველოს პარლამენტის თავმჯდომარე, ოპოზიციური ბლოკის „ბურჯანაძე-დემოკრატები“ თანალიდერი',
    photo: portrait('burjanadze'),
  },
  {
    code: 'ge',
    name: 'დავით თევზაძე',
    role: 'საქართველოს თავდაცვის მინისტრი',
    photo: portrait('tevzadze'),
  },
  {
    code: 'ge',
    name: 'ასლან აბაშიძე',
    role: 'აჭარის ავტონომიური რესპუბლიკის უზენაესი საბჭოს თავმჯდომარე, „დემოკრატიული აღორძინების კავშირის“ ლიდერი',
    photo: portrait('abashidze'),
  },
  {
    code: 'ge',
    name: 'ვალერიან ხაბურძანია',
    role: 'საქართველოს უშიშროების მინისტრი',
    photo: portrait('khaburdzania'),
  },
  {
    code: 'ge',
    name: 'კობა ნარჩემაშვილი',
    role: 'საქართველოს შინაგან საქმეთა მინისტრი',
    photo: portrait('narchemashvili'),
  },
  {
    code: 'ge',
    name: 'ზურაბ ჟვანია',
    role: 'ბლოკ „ბურჯანაძე-დემოკრატების“ თანალიდერი, პარლამენტის ყოფილი თავმჯდომარე',
    photo: portrait('zhvania'),
  },
  {
    code: 'ge',
    name: 'შალვა ნათელაშვილი',
    role: 'საქართველოს ლეიბორისტული პარტიის დამფუძნებელი და ლიდერი',
    photo: portrait('natelashvili'),
  },
  {
    code: '',
    name: 'მოძრაობა „კმარა“',
    role: 'სტუდენტური მოძრაობა',
    photo: portrait('kmara'),
  },
  {
    code: 'ge',
    name: 'ავთანდილ ჯორბენაძე',
    role: 'საქართველოს სახელმწიფო მინისტრი (მთავრობის მეთაური), ბლოკ „ახალი საქართველოსთვის“ ლიდერი',
    photo: portrait('jorbenadze'),
  },
  {
    code: 'us',
    name: 'რიჩარდ მაილსი',
    role: 'ამერიკის შეერთებული შტატების საგანგებო და სრულუფლებიანი ელჩი საქართველოში',
    photo: portrait('miles'),
  },
  {
    code: 'ru',
    name: 'იგორ ივანოვი',
    role: 'რუსეთის ფედერაციის საგარეო საქმეთა მინისტრი',
    photo: portrait('ivanov'),
  },
  {
    code: 'ge',
    name: 'ირაკლი ბათიაშვილი',
    role: 'საქართველოს საინფორმაციო-დაზვერვის სამსახურის ყოფილი უფროსი, „ოპოზიციონერი“ პოლიტიკოსი',
    photo: portrait('batiashvili'),
  },
  {
    code: 'gb',
    name: 'ბრიუს ჯორჯი',
    role: 'ეუთო-ს (OSCE) საპარლამენტო ასამბლეის პრეზიდენტი და საერთაშორისო სადამკვირვებლო მისიის ხელმძღვანელი',
    photo: portrait('george'),
  },
  {
    code: 'ge',
    name: 'ეროსი კიწმარიშვილი',
    role: 'ტელეკომპანია „რუსთავი 2“-ის დამფუძნებელი და მფლობელი',
    photo: portrait('kitsmarishvili'),
  },
];

export const HCC_PORTRAIT_SLUGS = HCC_ROSTER.map((seat) =>
  seat.photo.replace('/mun/hcc/', '').replace('.jpg', '')
);
