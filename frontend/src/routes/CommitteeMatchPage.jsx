import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import banner from '../assets/banner.jpeg';

const EASE = [0.22, 1, 0.36, 1];

const COMMITTEES = [
  {
    id: 'disec',
    abbr: 'DISEC',
    name: 'განიარაღებისა და საერთაშორისო უსაფრთხოების კომიტეტი',
    icon: 'bi-diagram-3-fill',
  },
  {
    id: 'specpol',
    abbr: 'SPECPOL',
    name: 'სპეციალური პოლიტიკისა და დეკოლონიზაციის კომიტეტი',
    icon: 'bi-globe',
  },
  {
    id: 'unsc',
    abbr: 'UNSC',
    name: 'გაეროს უშიშროების საბჭო',
    icon: 'bi-shield-check',
  },
  {
    id: 'press',
    abbr: 'PRESS CORPS',
    name: 'პრეს-კორპუსი',
    icon: 'bi-newspaper',
  },
  {
    id: 'unhrc',
    abbr: 'UNHRC',
    name: 'გაეროს ადამიანის უფლებათა საბჭო',
    icon: 'bi-people-fill',
  },
  {
    id: 'hcc',
    abbr: 'HCC',
    name: 'ისტორიული კრიზისის კომიტეტი',
    icon: 'bi-clock-history',
  },
];

const QUESTIONS = [
  {
    text: 'როგორ არწმუნებ სხვა დელეგატებს შემოუერთნენ შენს ბლოკს?',
    options: [
      {
        text: 'ვცდილობ ძლიერი არგუმენტებით დავარწმუნო სხვა დელეგატები, რომ ჩემს ბლოკს შემოუერთდნენ',
        committees: ['disec', 'specpol'],
      },
      {
        text: 'ვეძებ ძლიერ დელეგატს, რომელიც რეალურად წყვეტს საკითხს და მასთან ვაწარმოებ მოლაპარაკებებს',
        committees: ['unsc'],
      },
      {
        text: 'დავდივარ სხვადასხვა ჯგუფებს შორის და ვაგროვებ ინფორმაციას. ვინარჩუნებ ნეიტრალურ პოზიციას',
        committees: ['press'],
      },
      {
        text: 'ვცდილობ გამოვიდე ემოციური სიტყვით და ვეყრდნობი საერთო ღირებულებებს',
        committees: ['unhrc', 'hcc'],
      },
    ],
  },
  {
    text: 'რას აკეთებ თავისუფალ დროს?',
    options: [
      {
        text: 'ვაგრძელებ მუშაობას და წინა სესიიდან გამომდინარე ვწერ ახალ არგუმენტებს',
        committees: ['specpol', 'disec'],
      },
      {
        text: 'დროს ვატარებ სხვა ძლიერ დელეგატებთან და მათთან ვაწარმოებ არაფორმალურ მოლაპარაკებებს',
        committees: ['unsc'],
      },
      {
        text: 'ვესაუბრები ყველა დელეგატს სხვადასხვა კომიტეტებიდან ან ვწერ გოსიპებს',
        committees: ['press'],
      },
      {
        text: 'ჩემს მოკავშირეებთან ერთად ვგეგმავ ჩემს შემდეგ ნაბიჯს',
        committees: ['hcc', 'unhrc'],
      },
    ],
  },
  {
    text: 'რას გრძნობ, როდესაც კომიტეტში კრიზისი წარმოიქმნება?',
    options: [
      {
        text: 'თავდაპირველად სტრესს, მაგრამ ვცდილობ სწრაფად გავაანალიზო ფაქტები და არსებულს სიტუაციას მალე მოვერგო',
        committees: ['specpol', 'unsc'],
      },
      {
        text: 'ადრენალინს, მივიჩნევ, რომ სესია ყველაზე საინტერესო მოულოდნელ სიტუაციებში ხდება',
        committees: ['hcc', 'disec'],
      },
      {
        text: 'ინტერესს, ვიწყებ დაკვირვებას და ჩანაწერების გაკეთებას',
        committees: ['press'],
      },
      {
        text: 'აღშფოთებას იმაზე, თუ რა გავლენას იქონიებს ეს ყოველივე რეალურ ადამიანებზე',
        committees: ['unhrc'],
      },
    ],
  },
  {
    text: 'როგორი გამოსვლის სტილი გაქვს?',
    options: [
      {
        text: 'სტრუქტურული, ფაქტებზე და სტატისტიკაზე დაფუძნებული',
        committees: ['disec', 'specpol'],
      },
      {
        text: 'თავდაჯერებული და პირდაპირი. ვამბობ ზუსტად იმას, რისი გაკეთებაც შემიძლია',
        committees: ['unsc'],
      },
      {
        text: 'ობიექტური და დაბალანსებული. ვცდილობ ორივე მხარე წარმოვაჩინო',
        committees: ['press'],
      },
      {
        text: 'ემოციური და დამაჯერებელი. ვცდილობ სხვისი გრძნობები ჩემს სასიკეთოდ გამოვიყენო',
        committees: ['unhrc', 'hcc'],
      },
    ],
  },
  {
    text: 'რას აკეთებ, თუ დღის ბოლოს შენი პოზიცია წაგებული ჩანს?',
    options: [
      {
        text: 'ვცდილობ ჩემს არგუმენტებში ვიპოვო ნაკლი და ვაუმჯობესებ მათ.',
        committees: ['specpol', 'disec'],
      },
      {
        text: 'ვიცვლი სტრატეგიას და ვეძებ უკეთეს მოკავშირეებს. ჩემთვის მთავარი გამარჯვებაა.',
        committees: ['hcc'],
      },
      {
        text: 'ვინარჩუნებ ნეიტრალიტეტს. ჩემთვის მთავარი ობიექტურობაა.',
        committees: ['press'],
      },
      {
        text: 'ჩემს პრინციპებს არ ვღალატობ. ხანდახან, გამარჯვებაზე უკეთესი მორალის შენარჩუნებაა',
        committees: ['unhrc'],
      },
    ],
  },
  {
    text: 'რომელი საგანი/ თემა გიყვარდა ყველაზე მეტად სკოლაში?',
    options: [
      { text: 'მათემატიკა და ფიზიკა', committees: ['disec'] },
      { text: 'ეკონომიკა და ბიზნესი', committees: ['unsc', 'specpol'] },
      { text: 'ისტორია', committees: ['hcc'] },
      { text: 'ლიტერატურა და ფსიქოლოგია', committees: ['unhrc', 'press'] },
    ],
  },
  {
    text: 'რას ფიქრობ წესებთან დაკავშირებით?',
    options: [
      {
        text: 'ვცდილობ წესები დავიცვა, რადგან წესრიგი მნიშვნელოვანია პროდუქტიული განხილვისთვის',
        committees: ['disec', 'unhrc'],
      },
      {
        text: 'წესებს ვიცავ და მათ ჩემს სასარგებლოდ ვიყენებ',
        committees: ['unsc', 'specpol'],
      },
      {
        text: 'მოქნილობა მირჩევნია. თუ სიტუაცია მოითხოვს მე მათ ვარღვევ',
        committees: ['hcc', 'press'],
      },
    ],
  },
  {
    text: 'რა გაწუხებს ყველაზე მეტად კამათის დროს?',
    options: [
      {
        text: 'როდესაც ჩემი მოწინააღმდეგე იყენებს არასწორს სტატისტიკას ან ფაქტებს',
        committees: ['specpol', 'disec', 'unsc'],
      },
      {
        text: 'როდესაც სიტუაციას აფასებენ სუბიექტურად და არა ობიექტურად',
        committees: ['press'],
      },
      {
        text: 'როდესაც სხვა დელეგატი კარგავს ადამიანურობას და მხოლოდ კამათის მოგებაზეა ორიენტირებული',
        committees: ['unhrc'],
      },
      {
        text: 'როდესაც მათი არგუმენტები პროგნოზირებადია',
        committees: ['hcc'],
      },
    ],
  },
  {
    text: 'როგორ იღებ გადაწყვეტილებებს სწრაფად?',
    options: [
      {
        text: 'ვცდილობ შევინარჩუნო სიმშვიდე და ფაქტებზე დაყრდნობით მივიღო გადაწყეტილება',
        committees: ['specpol', 'disec'],
      },
      {
        text: 'ვენდობი ჩემს ინსტიქტებს და თამამად ვიღებ გადაწყვეტილებებს',
        committees: ['unsc', 'hcc'],
      },
      {
        text: 'ვფიქრობ ვიზე იქონიებს ეს გავლენას და ამის მიხედვით ვიღებ გადაწყვეტილებას',
        committees: ['unhrc'],
      },
      {
        text: 'არ ვჩქარობ. ვაკვირდები სხვებს და ამის მიხედვით მირებ გადაწყვეტილებებს',
        committees: ['press'],
      },
    ],
  },
  {
    text: 'ვინ არის შენი საყვარელი ისტორიული პიროვნება?',
    options: [
      { text: 'ოტო ფონ ბისმარკი', committees: ['unsc'] },
      { text: 'უისტონ ჩერჩილი', committees: ['hcc'] },
      { text: 'მარტინ ლუთერ კინგი', committees: ['press', 'unhrc'] },
      { text: 'იოსებ სტალინი', committees: ['specpol', 'disec'] },
    ],
  },
];

const CANVAS_FONT_HEADING = "700 126px 'Montserrat', sans-serif";
const CANVAS_FONT_BODY = "400 54px 'Extrasquare Mtavruli', sans-serif";
const CANVAS_FONT_LABEL = "600 36px 'Extrasquare Mtavruli', sans-serif";
const CANVAS_FONT_FOOTER = "500 28px 'Extrasquare Mtavruli', sans-serif";
const CANVAS_FONT_CTA = "700 46px 'Extrasquare Mtavruli', sans-serif";

const REVEAL_INTERVALS = [
  70, 70, 75, 80, 85, 90, 100, 110, 125, 140, 160, 185, 215, 250, 290, 340, 400, 470, 550,
];
const REVEAL_PARTICLE_COUNT = 30;
const REVEAL_LOCK_HOLD_MS = 2500;
const TRANSITION_MS = 320;

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function wrapCenteredText(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, centerX, startY + i * lineHeight));
  return lines.length * lineHeight;
}

// Draws text centered at (centerX, y), shrinking the font size (in 4px
// steps, down to minSize) until it fits maxWidth. Needed because committee
// abbreviations vary a lot in length ("HCC" vs "PRESS CORPS") but all share
// one big headline treatment.
function drawFittedText(ctx, text, centerX, y, maxWidth, fontTemplate, minSize = 48) {
  let size = parseInt(fontTemplate.match(/(\d+)px/)?.[1] ?? '96', 10);
  ctx.font = fontTemplate;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 4;
    ctx.font = fontTemplate.replace(/\d+px/, `${size}px`);
  }
  ctx.fillText(text, centerX, y);
}

// Mimics CSS `background-size: cover; background-position: X% Y%` inside a
// w×h box starting at (x, y).
function drawCoverImage(ctx, img, x, y, w, h, posXPercent = 50, posYPercent = 50) {
  const scale = Math.max(w / img.width, h / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const dx = x + (w - drawWidth) * (posXPercent / 100);
  const dy = y + (h - drawHeight) * (posYPercent / 100);
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
}

function drawShareCard(canvas, result, logoImg, bannerImg) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width; // 1080 — native Instagram Story width
  const H = canvas.height; // 1920 — native Instagram Story height

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b0a08';
  ctx.fillRect(0, 0, W, H);

  // Same treatment as the homepage hero banner: cover, grayscale/contrast
  // filter, low opacity, anchored slightly below center — then a dark
  // gradient (also matching the hero's overlay) so the text stays legible.
  if (bannerImg) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.filter = 'grayscale(10%) contrast(1.05)';
    drawCoverImage(ctx, bannerImg, 0, 0, W, H, 50, 38);
    ctx.restore();
  }

  const heroDark = ctx.createLinearGradient(0, 0, 0, H);
  heroDark.addColorStop(0, 'rgba(11,10,8,0.35)');
  heroDark.addColorStop(0.55, 'rgba(11,10,8,0.78)');
  heroDark.addColorStop(1, 'rgba(11,10,8,1)');
  ctx.fillStyle = heroDark;
  ctx.fillRect(0, 0, W, H);

  const heroRadial = ctx.createRadialGradient(W * 0.5, H * 0.28, 0, W * 0.5, H * 0.28, W * 0.75);
  heroRadial.addColorStop(0, 'rgba(212,175,90,0.12)');
  heroRadial.addColorStop(1, 'rgba(212,175,90,0)');
  ctx.fillStyle = heroRadial;
  ctx.fillRect(0, 0, W, H);

  const glowTop = ctx.createRadialGradient(W * 0.82, H * 0.1, 0, W * 0.82, H * 0.1, W * 0.65);
  glowTop.addColorStop(0, 'rgba(212,175,90,0.28)');
  glowTop.addColorStop(1, 'rgba(212,175,90,0)');
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, W, H);

  const glowBottom = ctx.createRadialGradient(W * 0.16, H * 0.88, 0, W * 0.16, H * 0.88, W * 0.75);
  glowBottom.addColorStop(0, 'rgba(212,175,90,0.16)');
  glowBottom.addColorStop(1, 'rgba(212,175,90,0)');
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = 'rgba(212,175,90,0.32)';
  ctx.lineWidth = 2;
  [430, 320].forEach((r) => {
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.46, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  ctx.fillStyle = 'rgba(212,175,90,0.05)';
  for (let y = 60; y < H; y += 56) {
    for (let x = 60; x < W; x += 56) {
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.textAlign = 'center';

  ctx.fillStyle = '#d4af5a';
  ctx.font = "600 30px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText('GLOBAL ARENA MUN 2026', W / 2, 130);

  if (logoImg) {
    const logoW = 150;
    const logoH = (logoImg.height / logoImg.width) * logoW;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(logoImg, W / 2 - logoW / 2, 175, logoW, logoH);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = CANVAS_FONT_LABEL;
  ctx.fillText('შენი კომიტეტია', W / 2, 620);

  const abbrGradient = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
  abbrGradient.addColorStop(0, '#b8934a');
  abbrGradient.addColorStop(0.5, '#f3d98a');
  abbrGradient.addColorStop(1, '#b8934a');
  ctx.fillStyle = abbrGradient;
  drawFittedText(ctx, result.abbr, W / 2, 780, W - 160, CANVAS_FONT_HEADING);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = CANVAS_FONT_BODY;
  wrapCenteredText(ctx, result.name, W / 2, 900, W - 220, 64);

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  drawFittedText(ctx, 'გაიგე რომელი კომიტეტი შეგეფერება', W / 2, H - 320, W - 160, CANVAS_FONT_CTA, 30);

  // Underlined so it reads as a link — note this is a flat PNG, so it isn't
  // actually clickable; Instagram doesn't parse links out of image pixels.
  // Anyone posting it would still need to add their own Link Sticker.
  const linkText = 'https://g-arena.org/committee-match';
  const linkY = H - 260;
  ctx.fillStyle = 'rgba(212,175,90,0.85)';
  ctx.font = CANVAS_FONT_FOOTER;
  ctx.fillText(linkText, W / 2, linkY);
  const linkWidth = ctx.measureText(linkText).width;
  ctx.strokeStyle = 'rgba(212,175,90,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - linkWidth / 2, linkY + 8);
  ctx.lineTo(W / 2 + linkWidth / 2, linkY + 8);
  ctx.stroke();
}

const questionVariants = {
  enter: (dir) => ({ opacity: 0, x: dir >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
  exit: (dir) => ({
    opacity: 0,
    x: dir >= 0 ? -40 : 40,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  }),
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}

export default function CommitteeMatchPage() {
  const [phase, setPhase] = useState('intro'); // intro | quiz | reveal | result
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // array of committee-id arrays, one per answered question
  const [direction, setDirection] = useState(1);
  const [result, setResult] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  // Guards against double-advancing when a question or the back button is
  // clicked rapidly: without this, two clicks fired within the 320ms
  // transition window can each schedule their own setQIndex(i => i + 1),
  // which lets qIndex skip past the last valid index and makes
  // QUESTIONS[qIndex] undefined — that's what crashed QuestionCard before.
  const [isAdvancing, setIsAdvancing] = useState(false);

  const canvasRef = useRef(null);
  const logoImgRef = useRef(null);
  const bannerImgRef = useRef(null);
  // Flip once each background image finishes loading so the share-card
  // effect re-runs and redraws with them included, even if the person
  // opens the share modal before the assets are ready.
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [bannerLoaded, setBannerLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      logoImgRef.current = img;
      setLogoLoaded(true);
    };
    img.src = logo;
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      bannerImgRef.current = img;
      setBannerLoaded(true);
    };
    img.src = banner;
  }, []);

  useEffect(() => {
    if (!shareOpen || !result || !canvasRef.current) return undefined;
    let cancelled = false;
    (async () => {
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Font Loading API not fully supported — draw with fallback fonts anyway
        }
      }
      if (!cancelled) {
        drawShareCard(canvasRef.current, result, logoImgRef.current, bannerImgRef.current);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareOpen, result, logoLoaded, bannerLoaded]);

  // Every committee named in a chosen answer gets a full point, so a single
  // answer can boost two (or three) committees at once. Ties keep whichever
  // committee appears first in COMMITTEES.
  const computeResult = (allAnswers) => {
    const counts = {};
    COMMITTEES.forEach((c) => {
      counts[c.id] = 0;
    });
    allAnswers.forEach((committeeIds) => {
      committeeIds.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    let best = COMMITTEES[0];
    let bestCount = -1;
    COMMITTEES.forEach((c) => {
      if (counts[c.id] > bestCount) {
        bestCount = counts[c.id];
        best = c;
      }
    });
    setResult(best);
    setPhase('reveal');
  };

  const selectOption = (committees) => {
    if (isAdvancing) return; // ignore rapid re-clicks mid-transition
    setIsAdvancing(true);

    const next = [...answers, committees];
    setAnswers(next);

    if (qIndex + 1 < QUESTIONS.length) {
      setTimeout(() => {
        setDirection(1);
        setQIndex((i) => i + 1);
        setIsAdvancing(false);
      }, TRANSITION_MS);
    } else {
      setTimeout(() => computeResult(next), TRANSITION_MS);
    }
  };

  const goBack = () => {
    if (qIndex === 0 || isAdvancing) return;
    setDirection(-1);
    setAnswers((prev) => prev.slice(0, -1));
    setQIndex((i) => i - 1);
  };

  const retake = () => {
    setAnswers([]);
    setQIndex(0);
    setDirection(-1);
    setResult(null);
    setIsAdvancing(false);
    setPhase('intro');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    canvas.toBlob(
      (blob) => {
        if (blob) downloadBlob(blob, `gamun-committee-${result.id}.png`);
      },
      'image/png',
      0.95
    );
  };

  const handleShare = () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const file = new File([blob], `gamun-committee-${result.id}.png`, { type: 'image/png' });
        const shareData = {
          files: [file],
          title: 'ჩემი კომიტეტი — GAMUN 2026',
          text: `ჩემი კომიტეტია ${result.abbr}! გაიგე შენც, რომელი კომიტეტი გერგება.`,
        };
        if (navigator.canShare && navigator.canShare({ files: shareData.files })) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if (err?.name !== 'AbortError') {
              toast.error('გაზიარება ვერ მოხერხდა — სცადეთ სურათის გადმოწერა.');
            }
          }
        } else {
          downloadBlob(blob, `gamun-committee-${result.id}.png`);
          toast('სურათი გადმოწერილია — ატვირთე Instagram Story-ზე', { icon: '📥' });
        }
      },
      'image/png',
      0.95
    );
  };

  const progress = phase === 'quiz' ? (qIndex / QUESTIONS.length) * 100 : 0;
  const currentQuestion = QUESTIONS[qIndex];

  return (
    <div className="committeeMatch">
      <section className="committeeMatch__inner">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <IntroScreen
              key="intro"
              onStart={() => setPhase('quiz')}
            />
          )}

          {/* Defensive guard: only render the quiz once currentQuestion is a
              real object. If qIndex were ever out of range (shouldn't happen
              now that selectOption/goBack are locked during transitions,
              but this keeps a stray edge case from crashing the page) we
              simply render nothing for a frame instead of throwing. */}
          {phase === 'quiz' && currentQuestion && (
            <motion.div
              key="quiz"
              className="committeeQuiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="committeeQuiz__top">
                {qIndex > 0 ? (
                  <button
                    type="button"
                    className="committeeQuiz__back"
                    onClick={goBack}
                    disabled={isAdvancing}
                    aria-label="წინა კითხვა"
                  >
                    <i className="bi bi-arrow-left" />
                  </button>
                ) : (
                  <span />
                )}
                <span className="committeeQuiz__count">
                  {qIndex + 1} / {QUESTIONS.length}
                </span>
              </div>
              <div className="committeeQuiz__track">
                <motion.div
                  className="committeeQuiz__fill"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: EASE }}
                />
              </div>

              <AnimatePresence
                mode="wait"
                custom={direction}
                initial={false}
              >
                <QuestionCard
                  key={qIndex}
                  direction={direction}
                  question={currentQuestion}
                  onSelect={selectOption}
                  disabled={isAdvancing}
                />
              </AnimatePresence>
            </motion.div>
          )}

          {phase === 'reveal' && result && (
            <RevealScreen
              key="reveal"
              result={result}
              onComplete={() => setPhase('result')}
            />
          )}

          {phase === 'result' && result && (
            <ResultScreen
              key="result"
              result={result}
              onRetake={retake}
              onShare={() => setShareOpen(true)}
            />
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {shareOpen && (
          <ShareModal
            result={result}
            canvasRef={canvasRef}
            onClose={() => setShareOpen(false)}
            onShare={handleShare}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function IntroScreen({ onStart }) {
  return (
    <motion.div
      className="committeeIntro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <span className="committeeIntro__badge">GLOBAL ARENA MUN 2026</span>
      <h1 className="committeeIntro__title">
        რომელი <em>კომიტეტია</em> შენთვის?
      </h1>
      <p className="committeeIntro__desc">
        უპასუხე 10 მოკლე კითხვას და გაარკვიე, თუ რომელი კომიტეტი შეგეფერება შენ ყველაზე მეტად.
      </p>
      <motion.button
        type="button"
        className="submitBtn"
        onClick={onStart}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        დაწყება <i className="bi bi-arrow-right" />
      </motion.button>
    </motion.div>
  );
}

function QuestionCard({ question, onSelect, direction, disabled }) {
  return (
    <motion.div
      className="committeeQuestion"
      custom={direction}
      variants={questionVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <h2 className="committeeQuestion__text">{question.text}</h2>
      <div className="committeeQuestion__options">
        {question.options.map((opt, i) => (
          <button
            type="button"
            key={i}
            className="committeeOption"
            disabled={disabled}
            onClick={() => onSelect(opt.committees)}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ---- The reveal sequence: a "sorting hat" style suspense beat between the
// last question and the result screen. The icon cycles through every
// committee like a decelerating slot reel, then locks onto the real result
// with a burst of gold particles before handing off to ResultScreen.
function RevealScreen({ result, onComplete }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayCommittee, setDisplayCommittee] = useState(result);
  const [stage, setStage] = useState('spinning'); // spinning | locked

  const particles = useMemo(
    () =>
      Array.from({ length: REVEAL_PARTICLE_COUNT }, (_, i) => {
        const angle = (i / REVEAL_PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 130 + Math.random() * 150;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          delay: Math.random() * 0.18,
          size: 3 + Math.random() * 5,
        };
      }),
    [result.id]
  );

  useEffect(() => {
    let cancelled = false;
    const timers = [];

    if (prefersReducedMotion) {
      setDisplayCommittee(result);
      setStage('locked');
      timers.push(setTimeout(() => !cancelled && onComplete(), 700));
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    const pool = COMMITTEES.filter((c) => c.id !== result.id);
    let step = 0;

    const runStep = () => {
      if (cancelled) return;
      if (step < REVEAL_INTERVALS.length - 1) {
        const candidate = pool.length ? pool[Math.floor(Math.random() * pool.length)] : result;
        setDisplayCommittee(candidate);
        step += 1;
        timers.push(setTimeout(runStep, REVEAL_INTERVALS[step]));
      } else {
        setDisplayCommittee(result);
        setStage('locked');
        timers.push(setTimeout(() => !cancelled && onComplete(), REVEAL_LOCK_HOLD_MS));
      }
    };

    timers.push(setTimeout(runStep, REVEAL_INTERVALS[0]));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [result, onComplete, prefersReducedMotion]);

  const locked = stage === 'locked';

  return (
    <motion.div
      className={`committeeReveal${locked ? ' committeeReveal--locked' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: EASE } }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="committeeReveal__stage">
        {!prefersReducedMotion && (
          <div
            className="committeeReveal__rings"
            aria-hidden="true"
          >
            <span className="committeeReveal__ring committeeReveal__ring--a" />
            <span className="committeeReveal__ring committeeReveal__ring--b" />
            <span className="committeeReveal__ring committeeReveal__ring--c" />
          </div>
        )}

        {locked && !prefersReducedMotion && (
          <>
            <motion.span
              className="committeeReveal__flash"
              initial={{ opacity: 0.9, scale: 0.6 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              aria-hidden="true"
            />
            {particles.map((p) => (
              <motion.span
                key={p.id}
                className="committeeReveal__particle"
                style={{ width: p.size, height: p.size }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
                transition={{ duration: 1.15, delay: p.delay, ease: 'easeOut' }}
                aria-hidden="true"
              />
            ))}
          </>
        )}

        <div className="committeeReveal__iconWrap">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={displayCommittee.id}
              className="committeeReveal__icon"
              initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: locked ? 1.12 : 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: locked ? 0.5 : 0.12, ease: EASE }}
            >
              <i className={`bi ${displayCommittee.icon}`} />
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="committeeReveal__caption">
          <AnimatePresence mode="wait">
            {!locked ? (
              <motion.p
                key="determining"
                className="committeeReveal__determining"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                ვადგენთ შენთვის შესაფერის კომიტეტს
                <span
                  className="committeeReveal__dots"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </span>
              </motion.p>
            ) : (
              <motion.div
                key="locked"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
              >
                <p className="committeeReveal__label">შენი კომიტეტია</p>
                <h2 className="committeeReveal__abbr">{result.abbr}</h2>
                <p className="committeeReveal__name">{result.name}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function ResultScreen({ result, onRetake, onShare }) {
  return (
    <motion.div
      className="committeeResult"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <div className="committeeResult__icon">
        <i className={`bi ${result.icon}`} />
      </div>
      <p className="committeeResult__label">შენი კომიტეტია</p>
      <h2 className="committeeResult__abbr">{result.abbr}</h2>
      <p className="committeeResult__name">{result.name}</p>

      <div className="committeeResult__actions">
        <motion.button
          type="button"
          className="submitBtn"
          onClick={onShare}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <i className="bi bi-instagram" /> გააზიარე ინსტაგრამზე
        </motion.button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onRetake}
        >
          თავიდან გავლა
        </button>
      </div>

      <a
        href="https://applications.g-arena.org"
        className="committeeResult__registerLink"
        target='blank'
      >
        მზად ხარ დარეგისტრირდე? <i className="bi bi-arrow-right" />
      </a>
    </motion.div>
  );
}

function ShareModal({ result, canvasRef, onClose, onShare, onDownload }) {
  return (
    <motion.div
      className="committeeShareModal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.div
        className="committeeShareModal__card"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="committeeShareModal__close"
          onClick={onClose}
          aria-label="დახურვა"
        >
          <i className="bi bi-x-lg" />
        </button>
        <div className="committeeShareModal__preview">
          <canvas
            ref={canvasRef}
            width={1080}
            height={1920}
            className="committeeShareModal__canvas"
            role="img"
            aria-label={
              result ? `${result.abbr} — GLOBAL ARENA MUN 2026 კომიტეტის შედეგი` : 'შედეგის სურათი'
            }
          />
        </div>
        <div className="committeeShareModal__actions">
          <motion.button
            type="button"
            className="submitBtn"
            onClick={onShare}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="bi bi-share-fill" /> გაზიარება
          </motion.button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onDownload}
          >
            <i className="bi bi-download" /> გადმოწერა
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}