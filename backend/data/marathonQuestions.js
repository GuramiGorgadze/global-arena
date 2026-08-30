// Placeholder question bank for the IR Marathon.
// Replace the text/options/correctIndex below with your real questions —
// nothing else in the app needs to change as long as you keep the same
// shape: { id, question, options: [4 strings], correctIndex: 0-3 }.
//
// correctIndex is NEVER sent to the client — the controller strips it
// before responding to /api/marathon/questions and grades server-side.

export const MARATHON_QUESTIONS = [
  {
    id: "q1",
    question: "რომელ წელს დაარსდა გაერო?",
    options: ["1919", "1945", "1938", "1963"],
    correctIndex: 1,
  },
  {
    id: "q2",
    question: "რამდენი მუდმივი წევრი ჰყავს გაეროს უშიშროების საბჭოს?",
    options: ["5", "6", "10", "15"],
    correctIndex: 0,
  },
  {
    id: "q3",
    question: "სად მდებარეობს გაეროს შტაბ-ბინა?",
    options: ["ჟენევა", "ვენა", "ნიუ-იორკი", "ბრიუსელი"],
    correctIndex: 2,
  },
  {
    id: "q4",
    question: "რომელი ორგანიზაცია ითვლება გაეროს წინამორბედად?",
    options: ["ერთა ლიგა", "NATO", "OSCE", "ევროკავშირი"],
    correctIndex: 0,
  },
  {
    id: "q5",
    question: "შემდეგთაგან რომელი ქვეყანა არ არის უშიშროების საბჭოს მუდმივი წევრი?",
    options: ["საფრანგეთი", "გერმანია", "დიდი ბრიტანეთი", "ჩინეთი"],
    correctIndex: 1,
  },
  {
    id: "q6",
    question: "ვეტოს უფლება გაეროს უშიშროების საბჭოში ეკუთვნის:",
    options: [
      "ყველა წევრ ქვეყანას",
      "მხოლოდ მუდმივ წევრებს",
      "მხოლოდ გენერალურ მდივანს",
      "არცერთს — ვეტო არ არსებობს",
    ],
    correctIndex: 1,
  },
  {
    id: "q7",
    question: "სად მოეწერა ხელი გაეროს წესდებას 1945 წელს?",
    options: ["სან-ფრანცისკო", "ნიუ-იორკი", "ლონდონი", "პარიზი"],
    correctIndex: 0,
  },
  {
    id: "q8",
    question: "რომელ წელს იქნა მიღებული ადამიანის უფლებათა საყოველთაო დეკლარაცია?",
    options: ["1945", "1948", "1950", "1966"],
    correctIndex: 1,
  },
  {
    id: "q9",
    question: "რომელია გაეროს მთავარი სასამართლო ორგანო?",
    options: [
      "სისხლის სამართლის საერთაშორისო სასამართლო",
      "საერთაშორისო სასამართლო (ICJ)",
      "ევროპის ადამიანის უფლებათა სასამართლო",
      "არბიტრაჟის მუდმივმოქმედი პალატა",
    ],
    correctIndex: 1,
  },
  {
    id: "q10",
    question: "სად მდებარეობს საერთაშორისო სასამართლო?",
    options: ["ჰააგა", "ჟენევა", "ნიუ-იორკი", "ბრიუსელი"],
    correctIndex: 0,
  },
  {
    id: "q11",
    question: "გაეროს რომელი სააგენტოა პასუხისმგებელი გლობალურ ჯანდაცვაზე?",
    options: ["UNESCO", "WHO", "UNICEF", "UNHCR"],
    correctIndex: 1,
  },
  {
    id: "q12",
    question: "რომელ წელს დაარსდა ჩრდილოატლანტიკური ხელშეკრულების ორგანიზაცია (NATO)?",
    options: ["1945", "1949", "1955", "1961"],
    correctIndex: 1,
  },
  {
    id: "q13",
    question: "შემდეგთაგან რომელი ქვეყანაა G7-ის წევრი?",
    options: ["ინდოეთი", "ბრაზილია", "იაპონია", "სამხრეთ აფრიკა"],
    correctIndex: 2,
  },
  {
    id: "q14",
    question: "ორ ან მეტ სახელმწიფოს შორის დადებულ ფორმალურ შეთანხმებას ეწოდება:",
    options: ["რეზოლუცია", "ხელშეკრულება (ტრაქტატი)", "მემორანდუმი", "დეკლარაცია"],
    correctIndex: 1,
  },
  {
    id: "q15",
    question:
      "გაეროს რომელ ორგანოში აქვს ყველა წევრ ქვეყანას თანაბარი ხმის უფლება?",
    options: [
      "უშიშროების საბჭო",
      "გენერალური ასამბლეა",
      "სამდივნო",
      "ეკონომიკური და სოციალური საბჭო",
    ],
    correctIndex: 1,
  },
];