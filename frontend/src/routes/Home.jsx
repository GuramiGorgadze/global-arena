import { useEffect, useRef, useState } from 'react';
import logo from '../assets/logo.png';

const COMMITTEES = [
  {
    id: 'unsc',
    name: 'UNSC',
    fullName: 'უშიშროების საბჭო',
    icon: 'bi-shield-lock',
    desc: 'საერთაშორისო მშვიდობისა და უსაფრთხოების დაცვა — სწრაფი გადაწყვეტილებები რეალურ დროში მიმდინარე კრიზისებზე.',
  },
  {
    id: 'specpol',
    name: 'SPECPOL',
    fullName: 'სპეციალური პოლიტიკური კომიტეტი',
    icon: 'bi-flag',
    desc: 'დეკოლონიზაცია, ტერიტორიული დავები და გლობალური პოლიტიკური კონფლიქტები.',
  },
  {
    id: 'unhrc',
    name: 'UNHRC',
    fullName: 'ადამიანის უფლებათა საბჭო',
    icon: 'bi-people',
    desc: 'ადამიანის ფუნდამენტური უფლებების დაცვა და მათი დარღვევების მონიტორინგი მსოფლიო მასშტაბით.',
  },
  {
    id: 'hcc',
    name: 'HCC',
    fullName: 'ისტორიული კრიზისის კომიტეტი',
    icon: 'bi-hourglass-split',
    desc: 'ისტორიის გადამწყვეტი მომენტების ხელახლა გათამაშება — ალტერნატიული გადაწყვეტილებები, განსხვავებული მომავალი.',
  },
  {
    id: 'disec',
    name: 'DISEC',
    fullName: 'განიარაღებისა და საერთაშორისო უსაფრთხოების კომიტეტი',
    icon: 'bi-radioactive',
    desc: 'ინგლისურენოვანი კომიტეტი, ფოკუსირებული გლობალურ განიარაღებასა და უსაფრთხოების პოლიტიკაზე.',
    tag: 'ENG',
  },
  {
    id: 'presscorps',
    name: 'Press Corps',
    fullName: 'პრესის კორპუსი',
    icon: 'bi-camera-reels',
    desc: 'კონფერენციის გაშუქება — სტატიები, ინტერვიუები და დელეგატების მოქმედების დოკუმენტირება.',
  },
];

const STATS = [
  { target: 6, suffix: '', label: 'კომიტეტი' },
  { target: 0, suffix: '+', label: 'დელეგატი' },
  { target: 3, suffix: '', label: 'დღე' },
  { target: 0, suffix: '+', label: 'ქვეყანა' },
];

const SCHEDULE = [
  {
    day: 'I',
    title: 'გახსნა',
    time: '10:00 – 19:00',
    items: ['რეგისტრაცია და აკრედიტაცია', 'გახსნის ცერემონია', 'კომიტეტების პირველი სხდომა'],
  },
  {
    day: 'II',
    title: 'კრიზისი',
    time: '09:00 – 20:00',
    items: ['სრულდღიანი კომიტეტის სხდომები', 'კრიზისის განახლებები', 'სამუშაო დოკუმენტების მომზადება'],
  },
  {
    day: 'III',
    title: 'დახურვა',
    time: '09:00 – 18:00',
    items: ['საბოლოო რეზოლუციების კენჭისყრა', 'დახურვის ცერემონია', 'დაჯილდოება'],
  },
];

// Reveals an element with a fade/rise once it scrolls into view.
function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

// Animates a number counting up once its parent section becomes visible.
function useCountUp(target, active, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    let raf;
    let start;

    const tick = (ts) => {
      if (start === undefined) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

export default function HomePage() {
  return (
    <div className="home">
      <Hero />
      <Stats />
      <About />
      <Committees />
      <CtaBanner />
    </div>
  );
}

function Hero() {
  return (
    <section
      className="hero"
      id="top"
    >
      <div
        className="hero__rings"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 600 600"
          className="hero__ringsSvg"
        >
          <g className="hero__ringsOuter">
            <circle
              cx="300"
              cy="300"
              r="280"
            />
            <circle
              cx="300"
              cy="300"
              r="200"
            />
          </g>
          <g className="hero__ringsInner">
            <circle
              cx="300"
              cy="300"
              r="120"
            />
            <line
              x1="40"
              y1="300"
              x2="560"
              y2="300"
            />
            <line
              x1="300"
              y1="40"
              x2="300"
              y2="560"
            />
          </g>
        </svg>
      </div>

      <div className="hero__content">
        <span className="hero__badge">GAMUN 2026 · I სესია</span>
        <h1 className="hero__title">
          გახდი <em>ხმა</em>, <br />
          რომელსაც სამყარო უსმენს
        </h1>
        <p className="hero__subtitle">
          სამდღიანი დიპლომატიური სიმულაცია, ყოველი დელეგატი იბრძვის
          კავშირებისთვის და გავლენისთვის ექვს კომიტეტში.
        </p>
        <div className="hero__cta">
          <a
            href="/register"
            className="submitBtn"
          >
            დარეგისტრირდი <i className="bi bi-arrow-right" />
          </a>  
          <a
            href="#committees"
            className="btn btn--ghost"
          >
            კომიტეტების ნახვა
          </a>
        </div>
      </div>

      <div className="hero__scrollHint">
        <i className="bi bi-chevron-down" />
      </div>
    </section>
  );
}

function Stats() {
  const [ref, visible] = useReveal(0.4);

  return (
    <section
      className={`statsBar reveal ${visible ? 'reveal--visible' : ''}`}
      ref={ref}
    >
      {STATS.map((s, i) => (
        <StatItem
          key={s.label}
          stat={s}
          active={visible}
          index={i}
        />
      ))}
    </section>
  );
}

function StatItem({ stat, active, index }) {
  const value = useCountUp(stat.target, active);
  return (
    <div
      className="statsBar__item"
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <span className="statsBar__value">
        {value}
        {stat.suffix}
      </span>
      <span className="statsBar__label">{stat.label}</span>
    </div>
  );
}

function About() {
  const [ref, visible] = useReveal(0.25);

  return (
    <section
      className={`about reveal ${visible ? 'reveal--visible' : ''}`}
      id="about"
      ref={ref}
    >
      <div className="about__emblem">
        <div className="about__emblemGlow" />
        <img
          src={logo}
          alt=""
          aria-hidden="true"
        />
      </div>
      <div className="about__content">
        <div className="formDivider">
          <span>ჩვენ შესახებ</span>
        </div>
        <h2 className="about__title">რა არის მოდელირებული გაერო?</h2>
        <p className="about__text">
          Model United Nations — საგანმანათლებლო სიმულაცია, სადაც მოსწავლეები და სტუდენტები
          სახელმწიფოების დელეგატების როლში საერთაშორისო პრობლემებზე მოლაპარაკებას აწარმოებენ,
          წერენ რეზოლუციებს და იცავენ პოზიციებს დიპლომატიის წესების დაცვით.
        </p>
        <div className="about__features">
          <div className="about__feature">
            <i className="bi bi-mic" />
            <div>
              <p className="about__featureTitle">საჯარო გამოსვლა</p>
              <p className="about__featureText">დაიცავი პოზიცია დარბაზის წინაშე დამაჯერებლად.</p>
            </div>
          </div>
          <div className="about__feature">
            <i className="bi bi-diagram-3" />
            <div>
              <p className="about__featureTitle">მოლაპარაკება</p>
              <p className="about__featureText">იპოვე საერთო ენა 150-ზე მეტ დელეგატთან ერთად.</p>
            </div>
          </div>
          <div className="about__feature">
            <i className="bi bi-globe" />
            <div>
              <p className="about__featureTitle">გლობალური აზროვნება</p>
              <p className="about__featureText">გაიგე მსოფლიოს აქტუალური პრობლემები ღრმად.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Committees() {
  const [ref, visible] = useReveal(0.15);

  return (
    <section
      className="committees"
      id="committees"
    >
      <div className="sectionHeader">
        <h2>
          ჩვენი <em>კომიტეტები</em>
        </h2>
        <p>ექვსი კომიტეტი, ექვსი განსხვავებული გამოწვევა — თითოეული საკუთარი წესებითა და აგენდით</p>
      </div>

      <div
        className={`committees__grid reveal ${visible ? 'reveal--visible' : ''}`}
        ref={ref}
      >
        {COMMITTEES.map((c, i) => (
          <div
            className="committeeCard"
            key={c.id}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="committeeCard__top">
              <span className="committeeCard__icon">
                <i className={`bi ${c.icon}`} />
              </span>
              {c.tag && <span className="committeeCard__tag">{c.tag}</span>}
            </div>
            <p className="committeeCard__abbr">{c.name}</p>
            <p className="committeeCard__full">{c.fullName}</p>
            <p className="committeeCard__desc">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// function Schedule() {
//   const [ref, visible] = useReveal(0.15);

//   return (
//     <section
//       className="schedule"
//       id="schedule"
//     >
//       <div className="sectionHeader">
//         <h2>
//           სამი დღე, <em>ერთი მისია</em>
//         </h2>
//         <p>კონფერენციის მიმოხილვა დღეების მიხედვით</p>
//       </div>

//       <div
//         className={`schedule__timeline reveal ${visible ? 'reveal--visible' : ''}`}
//         ref={ref}
//       >
//         {SCHEDULE.map((s, i) => (
//           <div
//             className="schedule__item"
//             key={s.day}
//             style={{ transitionDelay: `${i * 120}ms` }}
//           >
//             {i < SCHEDULE.length - 1 && <div className="schedule__line" />}
//             <div className="schedule__num">{s.day}</div>
//             <div className="schedule__body">
//               <div className="schedule__heading">
//                 <p className="schedule__title">{s.title}</p>
//                 <span className="schedule__time">{s.time}</span>
//               </div>
//               <ul className="schedule__list">
//                 {s.items.map((it) => (
//                   <li key={it}>{it}</li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }

function CtaBanner() {
  const [ref, visible] = useReveal(0.3);

  return (
    <section
      className={`ctaBanner reveal ${visible ? 'reveal--visible' : ''}`}
      ref={ref}
    >
      <h2>
        მზად ხარ გახდე <em>დელეგატი</em>?
      </h2>
      <p>დაიკავე შენი ადგილი მოლაპარაკებების მაგიდასთან</p>
      <a
        href="/register"
        className="submitBtn"
      >
        დარეგისტრირდი <i className="bi bi-arrow-right" />
      </a>
    </section>
  );
}