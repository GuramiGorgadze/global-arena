import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

const EASE = [0.22, 1, 0.36, 1];

// ---- Customize these two freely — content, tone, committee suggestions ----
const TYPES = [
  {
    id: 'dip',
    name: 'დიპლომატი',
    icon: 'bi-people-fill',
    tagline: 'ალიანსების ოსტატი',
    description:
      'შენ ხარ დარბაზის გული — ყველა გიცნობს და ყველა გენდობა. ალიანსების აგება შენთვის ბუნებრივი ნიჭია და ხშირად სწორედ შენ დგახარ კომპრომისის უკან.',
    committees: ['UNHRC', 'SPECPOL'],
  },
  {
    id: 'str',
    name: 'სტრატეგი',
    icon: 'bi-diagram-3-fill',
    tagline: 'ყოველთვის სამი ნაბიჯით წინ',
    description:
      'სანამ სხვები დებატობენ, შენ უკვე რამდენიმე ნაბიჯით წინ ხარ. ზუსტი გეგმა, ჭკვიანი კოალიცია და გამართული რეზოლუცია — ეს არის შენი ხელწერა.',
    committees: ['UNSC', 'DISEC'],
  },
  {
    id: 'ora',
    name: 'ორატორი',
    icon: 'bi-mic-fill',
    tagline: 'ხმა, რომელსაც ყველა იხსენებს',
    description:
      'როცა შენ დგახარ პოდიუმთან, დარბაზი ჩუმდება. შენი სიტყვები არწმუნებს და შენი ვნება გადამდებია — შენ ხარ ხმა, რომელსაც ყველა იმახსოვრებს.',
    committees: ['HCC', 'Press Corps'],
  },
  {
    id: 'res',
    name: 'მკვლევარი',
    icon: 'bi-search',
    tagline: 'ფაქტი ყოველთვის ხელთ არის',
    description:
      'შენთვის არცერთი კითხვა არ არის მოულოდნელი — ფაქტები, სტატისტიკა და დეტალები ყოველთვის მზად გაქვს. სიღრმისეული მომზადება შენი ყველაზე ძლიერი იარაღია.',
    committees: ['DISEC', 'Press Corps'],
  },
  {
    id: 'imp',
    name: 'იმპროვიზატორი',
    icon: 'bi-lightning-charge-fill',
    tagline: 'ქაოსში საუკეთესო',
    description:
      'კრიზისი შენთვის პრობლემა კი არა, შანსია. სანამ სხვები იბნევიან, შენ უკვე ახალ, გაუთვალისწინებელ გეგმას აწყობ — სპონტანურობა შენი ზეძალაა.',
    committees: ['HCC', 'UNSC'],
  },
  {
    id: 'med',
    name: 'შუამავალი',
    icon: 'bi-shield-check',
    tagline: 'სიმშვიდის კუნძული',
    description:
      'დაძაბულ დარბაზში, შენ ხარ სიმშვიდის კუნძული. დაპირისპირებულ მხარეებს შორის საერთო ენის პოვნა შენი ნიჭია — ხშირად სწორედ ეს ინარჩუნებს კომიტეტს ერთად.',
    committees: ['UNHRC', 'SPECPOL'],
  },
];

const QUESTIONS = [
  {
    text: 'საბჭოს სხდომა იწყება — რას აკეთებ პირველი?',
    options: [
      { text: 'სხვა დელეგატებთან ვმეგობრდები და ალიანსებს ვქმნი', type: 'dip' },
      { text: 'დღის წესრიგს ვსწავლობ და წინასწარ ვგეგმავ', type: 'str' },
      { text: 'ჩემს გამოსვლას ვამზადებ — მინდა ყველამ დამიმახსოვროს', type: 'ora' },
      { text: 'ბოლო სტატისტიკებსა და ფაქტებს ვამოწმებ', type: 'res' },
    ],
  },
  {
    text: 'მოულოდნელი კრიზისის განახლება მოდის — შენი პირველი რეაქცია?',
    options: [
      { text: 'მაშინვე ვითხოვ სიტყვას, რომ პოზიცია გამოვხატო', type: 'ora' },
      { text: 'ვცდილობ გავიაზრო, რას ნიშნავს ეს ჩემი ქვეყნისთვის', type: 'res' },
      { text: 'მომწონს — აი, სადაც საინტერესო ხდება', type: 'imp' },
      { text: 'ვცდილობ დავამშვიდო დელეგატები, სანამ პანიკა დაიწყება', type: 'med' },
    ],
  },
  {
    text: 'არაფორმალური (unmoderated) კაუკუსის დროს, სად ხარ?',
    options: [
      { text: 'ყველა ჯგუფს ვესტუმრები, ურთიერთობებს ვამყარებ', type: 'dip' },
      { text: 'ჩემს ბლოკთან ვზივარ და ტექსტზე ვმუშაობ', type: 'str' },
      { text: 'სხვადასხვა ჯგუფში გადავრბივარ, იდეებს ვცვლი', type: 'imp' },
      { text: 'ორ დაპირისპირებულ ჯგუფს შორის ხიდს ვამყარებ', type: 'med' },
    ],
  },
  {
    text: 'შენი პოზიცია ეწინააღმდეგება უმრავლესობას — რას აკეთებ?',
    options: [
      { text: 'ვცდილობ ვინმეს დავარწმუნო, ჩემს მხარეს გადმოვიდეს', type: 'dip' },
      { text: 'ვეძებ გზას კომპრომისისკენ, დანაკარგის გარეშე', type: 'str' },
      { text: 'ვდგები და საჯაროდ ვიცავ პოზიციას ბოლომდე', type: 'ora' },
      { text: 'მტკიცებულებებს ვაგროვებ, არგუმენტის გასამყარებლად', type: 'res' },
    ],
  },
  {
    text: 'დოკუმენტში შესწორება შემოდის, რომელიც არავის მოსწონს',
    options: [
      { text: 'ავდივარ და ვხსნი, რატომ არის ეს არასწორი გზა', type: 'ora' },
      { text: 'დეტალურად ვამოწმებ, რას ცვლის ეს რეალურად', type: 'res' },
      { text: 'ვთავაზობ სულ ახალ, გაუთვალისწინებელ ალტერნატივას', type: 'imp' },
      { text: 'ორივე მხარეს შუალედურ ვარიანტს ვთავაზობ', type: 'med' },
    ],
  },
  {
    text: 'დრო იწურება, რეზოლუცია ჯერ არ არის მზად',
    options: [
      { text: 'ყველას ერთად ვკრებ, სწრაფად შესათანხმებლად', type: 'dip' },
      { text: 'ამოცანებს ვანაწილებ და პროცესს ბოლომდე ვმართავ', type: 'str' },
      { text: 'უკანასკნელ წუთს საუკეთესო იდეები მომდის', type: 'imp' },
      { text: 'ვამშვიდებ დაძაბულობას და ვინარჩუნებ თანამშრომლობას', type: 'med' },
    ],
  },
  {
    text: 'კონფერენციის ბოლოს, რით დაგამახსოვრდებიან?',
    options: [
      { text: 'ყველასთან მეგობრული ურთიერთობებით', type: 'dip' },
      { text: 'ჭკვიანურად აწყობილი კოალიციითა და შედეგებით', type: 'str' },
      { text: 'გამორჩეული, დამაჯერებელი გამოსვლებით', type: 'ora' },
      { text: 'სიღრმისეული ცოდნით ნებისმიერ საკითხზე', type: 'res' },
    ],
  },
  {
    text: 'დელეგატი ბოლო წუთს დახმარებას გთხოვს',
    options: [
      { text: 'ვეხმარები გამოსვლის მომზადებაში', type: 'ora' },
      { text: 'ვუზიარებ ჩემს კვლევასა და ფაქტებს', type: 'res' },
      { text: 'ერთად ვქმნით სულ ახალ მიდგომას', type: 'imp' },
      { text: 'ვეხმარები, სხვა ჯგუფთანაც საერთო ენა რომ გამონახოს', type: 'med' },
    ],
  },
];

// TODO: swap in your actual $font-display / $font-eng family names for a true brand match —
// canvas can't read SCSS variables, so these are plain CSS font strings.
const CANVAS_FONT_HEADING = "700 96px Georgia, 'PT Serif', serif";
const CANVAS_FONT_BODY = "400 34px 'Helvetica Neue', Arial, sans-serif";

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

function drawShareCard(canvas, result, logoImg) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width; // 1080 — native Instagram Story width
  const H = canvas.height; // 1920 — native Instagram Story height

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b0a08';
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
  ctx.fillText('GAMUN 2026 · დელეგატის ტიპი', W / 2, 130);

  if (logoImg) {
    const logoW = 150;
    const logoH = (logoImg.height / logoImg.width) * logoW;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(logoImg, W / 2 - logoW / 2, 175, logoW, logoH);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = "600 36px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText('შენ ხარ', W / 2, 540);

  const nameGradient = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
  nameGradient.addColorStop(0, '#b8934a');
  nameGradient.addColorStop(0.5, '#f3d98a');
  nameGradient.addColorStop(1, '#b8934a');
  ctx.fillStyle = nameGradient;
  ctx.font = CANVAS_FONT_HEADING;
  ctx.fillText(result.name, W / 2, 660);

  ctx.fillStyle = '#d4af5a';
  ctx.font = 'italic 500 34px Georgia, serif';
  ctx.fillText(result.tagline, W / 2, 720);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = CANVAS_FONT_BODY;
  wrapCenteredText(ctx, result.description, W / 2, 840, W - 220, 50);

  const chipY = 1180;
  ctx.font = "600 26px 'Helvetica Neue', Arial, sans-serif";
  const chipTexts = result.committees.map((c) => c.toUpperCase());
  const chipPaddingX = 30;
  const chipGap = 20;
  const chipWidths = chipTexts.map((t) => ctx.measureText(t).width + chipPaddingX * 2);
  const totalWidth = chipWidths.reduce((a, b) => a + b, 0) + chipGap * (chipTexts.length - 1);
  let chipX = W / 2 - totalWidth / 2;
  chipTexts.forEach((t, i) => {
    const w = chipWidths[i];
    ctx.strokeStyle = 'rgba(212,175,90,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(chipX, chipY - 32, w, 56, 28);
    } else {
      ctx.rect(chipX, chipY - 32, w, 56);
    }
    ctx.stroke();
    ctx.fillStyle = '#d4af5a';
    ctx.fillText(t, chipX + w / 2, chipY + 8);
    chipX += w + chipGap;
  });

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = "500 28px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText('გაარკვიე შენი ტიპი — gamun.ge/delegate-type', W / 2, H - 90);
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

export default function DelegateTypePage() {
  const [phase, setPhase] = useState('intro'); // intro | quiz | result
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [direction, setDirection] = useState(1);
  const [result, setResult] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const canvasRef = useRef(null);
  const logoImgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      logoImgRef.current = img;
    };
    img.src = logo;
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
      if (!cancelled) drawShareCard(canvasRef.current, result, logoImgRef.current);
    })();
    return () => {
      cancelled = true;
    };
  }, [shareOpen, result]);

  const computeResult = (allAnswers) => {
    const counts = {};
    TYPES.forEach((t) => {
      counts[t.id] = 0;
    });
    allAnswers.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    let best = TYPES[0];
    let bestCount = -1;
    TYPES.forEach((t) => {
      if (counts[t.id] > bestCount) {
        bestCount = counts[t.id];
        best = t;
      }
    });
    setResult(best);
    setPhase('result');
  };

  const selectOption = (type) => {
    const next = [...answers, type];
    setAnswers(next);
    if (qIndex + 1 < QUESTIONS.length) {
      setTimeout(() => {
        setDirection(1);
        setQIndex((i) => i + 1);
      }, 320);
    } else {
      setTimeout(() => computeResult(next), 320);
    }
  };

  const goBack = () => {
    if (qIndex === 0) return;
    setDirection(-1);
    setAnswers((prev) => prev.slice(0, -1));
    setQIndex((i) => i - 1);
  };

  const retake = () => {
    setAnswers([]);
    setQIndex(0);
    setDirection(-1);
    setResult(null);
    setPhase('intro');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    canvas.toBlob(
      (blob) => {
        if (blob) downloadBlob(blob, `gamun-delegate-${result.id}.png`);
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
        const file = new File([blob], `gamun-delegate-${result.id}.png`, { type: 'image/png' });
        const shareData = {
          files: [file],
          title: 'ჩემი დელეგატის ტიპი — GAMUN 2026',
          text: `მე ვარ ${result.name}! გაიგე შენც, რომელი ტიპის დელეგატი ხარ.`,
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
          downloadBlob(blob, `gamun-delegate-${result.id}.png`);
          toast('სურათი გადმოწერილია — ატვირთე Instagram Story-ზე', { icon: '📥' });
        }
      },
      'image/png',
      0.95
    );
  };

  const progress = phase === 'quiz' ? (qIndex / QUESTIONS.length) * 100 : 0;

  return (
    <div className="delegateType">
      <section className="delegateType__inner">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <IntroScreen
              key="intro"
              onStart={() => setPhase('quiz')}
            />
          )}

          {phase === 'quiz' && (
            <motion.div
              key="quiz"
              className="delegateQuiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="delegateQuiz__top">
                {qIndex > 0 ? (
                  <button
                    type="button"
                    className="delegateQuiz__back"
                    onClick={goBack}
                    aria-label="წინა კითხვა"
                  >
                    <i className="bi bi-arrow-left" />
                  </button>
                ) : (
                  <span />
                )}
                <span className="delegateQuiz__count">
                  {qIndex + 1} / {QUESTIONS.length}
                </span>
              </div>
              <div className="delegateQuiz__track">
                <motion.div
                  className="delegateQuiz__fill"
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
                  question={QUESTIONS[qIndex]}
                  onSelect={selectOption}
                />
              </AnimatePresence>
            </motion.div>
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
      className="delegateIntro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <span className="delegateIntro__badge">GAMUN 2026</span>
      <h1 className="delegateIntro__title">
        რომელი ტიპის <em>დელეგატი</em> ხარ?
      </h1>
      <p className="delegateIntro__desc">
        უპასუხე 8 მოკლე კითხვას სხდომის სცენარებზე და გაარკვიე, რომელი დელეგატის არქეტიპი გამოხატავს
        შენს სტილს საუკეთესოდ.
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

function QuestionCard({ question, onSelect, direction }) {
  return (
    <motion.div
      className="delegateQuestion"
      custom={direction}
      variants={questionVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <h2 className="delegateQuestion__text">{question.text}</h2>
      <div className="delegateQuestion__options">
        {question.options.map((opt) => (
          <button
            type="button"
            key={opt.type}
            className="delegateOption"
            onClick={() => onSelect(opt.type)}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ResultScreen({ result, onRetake, onShare }) {
  return (
    <motion.div
      className="delegateResult"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <div className="delegateResult__icon">
        <i className={`bi ${result.icon}`} />
      </div>
      <p className="delegateResult__label">შენ ხარ</p>
      <h2 className="delegateResult__name">{result.name}</h2>
      <p className="delegateResult__tagline">{result.tagline}</p>
      <p className="delegateResult__desc">{result.description}</p>

      <div className="delegateResult__committees">
        {result.committees.map((c) => (
          <span
            className="delegateResult__chip"
            key={c}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="delegateResult__actions">
        <motion.button
          type="button"
          className="submitBtn"
          onClick={onShare}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <i className="bi bi-instagram" /> გააზიარე Story-ზე
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
        href="/#register"
        className="delegateResult__registerLink"
      >
        მზად ხარ დარეგისტრირდე? <i className="bi bi-arrow-right" />
      </a>
    </motion.div>
  );
}

function ShareModal({ result, canvasRef, onClose, onShare, onDownload }) {
  return (
    <motion.div
      className="shareModal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.div
        className="shareModal__card"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="shareModal__close"
          onClick={onClose}
          aria-label="დახურვა"
        >
          <i className="bi bi-x-lg" />
        </button>
        <div className="shareModal__preview">
          <canvas
            ref={canvasRef}
            width={1080}
            height={1920}
            className="shareModal__canvas"
            role="img"
            aria-label={
              result ? `${result.name} — GAMUN 2026 დელეგატის ტიპის შედეგი` : 'შედეგის სურათი'
            }
          />
        </div>
        <div className="shareModal__actions">
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
