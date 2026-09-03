import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

const EASE = [0.22, 1, 0.36, 1];

const TYPES = [
  {
    id: 'dip',
    name: 'დიპლომატი',
    icon: 'bi-people-fill',
    tagline: 'ალიანსების ოსტატი',
    description:
      'შენ ხარ კომიტეტის ცენტრი. ყველა გიცნობს და ყველა გენდობა. ალიანსების შექმნა შენთვის ძალიან მარტივია და ხშირად სწორედ შენ ხარ მისი ლიდერი.',
    committees: ['UNHRC', 'SPECPOL'],
  },
  {
    id: 'str',
    name: 'სტრატეგი',
    icon: 'bi-diagram-3-fill',
    tagline: 'ყოველთვის სამი ნაბიჯით წინ',
    description:
      'სანამ სხვები დებატობენ, შენ უკვე რამდენიმე ნაბიჯით წინ ხარ. შენ უკვე გაქვს ზუსტი გეგმა და გონივრული იდეები.',
    committees: ['UNSC', 'DISEC'],
  },
  {
    id: 'ora',
    name: 'ორატორი',
    icon: 'bi-mic-fill',
    tagline: 'ხმა, რომელსაც მსოფლიო უსმენს',
    description:
      'როცა შენ გამოდიხარ სიტყვით, დარბაზი ჩუმდება. ტექსტებს არ იზეპირებ, თუმცა მიკროფონის ხელში აღებისას ისე ჩანს თითქოს ყოველი სიტყვა და ემოცია წინასწარ გათვლილი გქონდა.',
    committees: ['HCC', 'Press Corps'],
  },
  {
    id: 'res',
    name: 'მკვლევარი',
    icon: 'bi-search',
    tagline: 'დელეგატი, რომელიც ყოველთვის მზად არის',
    description:
      'შენ არანაირი კითხვა არ გაშინებს, რადგან ფაქტები, სტატისტიკები და დეტალები ყოველთვის მზად გაქვს. სიღრმისეული კვლევა შენი ყველაზე ძლიერი მხარეა.',
    committees: ['DISEC', 'Press Corps'],
  },
  {
    id: 'imp',
    name: 'იმპროვიზატორი',
    icon: 'bi-lightning-charge-fill',
    tagline: 'საუკეთესო ქაოსში',
    description:
      'კრიზისი შენთვის არა გამოწვევა, არამედ უპირატესობაა. სანამ სხვები იბნევიან, შენ უკვე ახალ, გაუთვალისწინებელ გეგმას ქმნი. სპონტანურობა შენი იარაღია.',
    committees: ['HCC', 'UNSC'],
  },
  {
    id: 'med',
    name: 'შუამავალი',
    icon: 'bi-shield-check',
    tagline: 'დელეგატებს შორის ხიდი',
    description:
      'დაძაბულ სიტუაციაში შენ ხარ ის, ვინც ურთიერთობებს ალაგებს. დაპირისპირებულ მხარეებს შორის საერთო ენის პოვნა შენი ძლიერი მხარეა. ხშირად სწორედ ეს ხდება გადამწყვეტი ნაბიჯი კომიტეტში.',
    committees: ['UNHRC', 'SPECPOL'],
  },
];

const QUESTIONS = [
  {
    text: 'იწყება პირველი საკომიტეტო სესია. რას აკეთებ პირველი?',
    options: [
      { text: 'სხვა დელეგატეს ვუმეგობრდები და ალიანსებს ვქმნი', type: 'dip' },
      { text: 'თემას ვსწავლობ და წინასწარ ვგეგმავ', type: 'str' },
      { text: 'ჩემს გახსნით სიტყვას ვიზეპირებ. მინდა ყველამ დამიმახსოვროს', type: 'ora' },
      { text: 'სტატისტიკებსა და ფაქტებს ვამოწმებ', type: 'res' },
    ],
  },
  {
    text: 'მოულოდნელად კრიზისული სიტუაცია დგება. რა არის შენი პირველი რეაქცია?',
    options: [
      { text: 'მაშინვე მინდა სიტყვით გამოვიდე, რომ პოზიცია დავაფიქსირო', type: 'ora' },
      { text: 'ვცდილობ აღვიქვა, რა გავლენა აქვს მას ჩემი ქვეყნისთვის', type: 'res' },
      { text: 'მომწონს. კრიზისები ყველაზე საინტერესო ნაწილია', type: 'imp' },
      {
        text: 'ვცდილობ ყველა მხარის პოზიცია მალევე გავიგო, სანამ გადაწყვეტილებას მივიღებ',
        type: 'med',
      },
    ],
  },
  {
    text: 'არაფორმალური დებატების დროს სად ხარ?',
    options: [
      { text: 'ყველა ჯგუფს ვესტუმრები, ურთიერთობებს ვამყარებ', type: 'dip' },
      { text: 'ჩემს ბლოკთან ვზივარ და ვმუშაობ', type: 'str' },
      { text: 'სხვადასხვა ჯგუფთან მივდივარ და იდეებს ვისმენ', type: 'imp' },
      { text: 'ვცდილობ ყველა მხარე გავაერთიანო', type: 'med' },
    ],
  },
  {
    text: 'შენი პოზიცია ეწინააღმდეგება უმრავლესობას. რას აკეთებ?',
    options: [
      { text: 'ვცდილობ ვინმეს დავარწმუნო, რომ ჩემს მხარეს გადმოვიდეს', type: 'dip' },
      { text: 'ვეძებ გზას კომპრომისისკენ რაც შეიძლება ნაკლები დანაკარგით', type: 'str' },
      { text: 'ვდგები და საჯაროდ ვიცავ ჩემს პოზიციას ბოლომდე', type: 'ora' },
      { text: 'მტკიცებულებებს ვაგროვებ პოზიციის გასამყარებლად', type: 'res' },
    ],
  },
  {
    text: 'დოკუმენტში შესწორებას აკეთებენ, რომელიც არავის მოსწონს',
    options: [
      { text: 'გამოვდივარ და ვხსნი, თუ რატომ არის ეს არასწორი შესწორება', type: 'ora' },
      { text: 'დეტალურად ვამოწმებ, რას ცვლის ეს რეალურად', type: 'res' },
      { text: 'ვთავაზობ სულ ახალ, გაუთვალისწინებელ ალტერნატივას', type: 'imp' },
      { text: 'ორივე მხარეს ისეთ ვარიანტს ვთავაზობ, რომელიც ორივეს მოსწონს', type: 'med' },
    ],
  },
  {
    text: 'დრო იწურება და რეზოლუცია ჯერ არ არის მზად',
    options: [
      { text: 'ყველას ერთად ვიხმობ, რომ სწრაფად დავწეროთ', type: 'dip' },
      { text: 'საქმეს ნაწილ-ნაწილ ვყოფ და დელეგატებს ვუნაწილებ', type: 'str' },
      { text: 'უკანასკნელ წუთს საუკეთესო იდეები მომდის', type: 'imp' },
      { text: 'ვამშვიდებ დაძაბულობას და ვინარჩუნებ სიმშვიდეს', type: 'med' },
    ],
  },
  {
    text: 'კონფერენციის ბოლოს რითი დაგიმახსოვრებენ?',
    options: [
      { text: 'ყველასთან მეგობრული ურთიერთობით', type: 'dip' },
      { text: 'გონივრულად გათვლილი აზრებითა და იდეებით', type: 'str' },
      { text: 'გამორჩეული, დამაჯერებელი გამოსვლებით', type: 'ora' },
      { text: 'სიღრმისეული ცოდნით ნებისმიერ საკითხზე', type: 'res' },
    ],
  },
  {
    text: 'შესვენების დროს უცნობ დელეგატთან საუბრის შესაძლებლობა მოგეცა. რას აკეთებ?',
    options: [
      { text: 'ვიწყებ საუბარს და ვცდილობ ახალი კავშირი დავამყარო', type: 'dip' },
      { text: 'ვარკვევ, როგორ შეიძლება ჩვენი ინტერესები დაემთხვეს', type: 'str' },
      { text: 'ვსაუბრობ იმაზე თუ რა ვჭამოთ', type: 'imp' },
      { text: 'ვცდილობ საუბარი ორივესთვის კომფორტული და მეგობრული იყოს', type: 'med' },
    ],
  },
];

const CANVAS_FONT_HEADING = "700 96px'DM Themestia', sans-serif";
const CANVAS_FONT_BODY = "400 34px Extrasquare Mtavruli', sans-serif;";

const REVEAL_INTERVALS = [
  70, 70, 75, 80, 85, 90, 100, 110, 125, 140, 160, 185, 215, 250, 290, 340, 400, 470, 550,
];
const REVEAL_PARTICLE_COUNT = 30;
const REVEAL_LOCK_HOLD_MS = 2500; // how long the locked result glows before the full ResultScreen takes over
const TRANSITION_MS = 320; // how long the question-advance / lock-out window lasts

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
  ctx.fillText('GLOBAL ARENA MUN 2026', W / 2, 130);

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
  ctx.fillText('გაარკვიე შენი ტიპი — g-arena.org/delegate-type', W / 2, H - 90);
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

export default function DelegateTypePage() {
  const [phase, setPhase] = useState('intro'); // intro | quiz | reveal | result
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
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
    setPhase('reveal');
  };

  const selectOption = (type) => {
    if (isAdvancing) return; // ignore rapid re-clicks mid-transition
    setIsAdvancing(true);

    const next = [...answers, type];
    setAnswers(next);

    if (qIndex + 1 < QUESTIONS.length) {
      setTimeout(() => {
        setDirection(1);
        setQIndex((i) => i + 1);
        setIsAdvancing(false);
      }, TRANSITION_MS);
    } else {
      setTimeout(() => computeResult(next), TRANSITION_MS);
      // isAdvancing intentionally stays true here — the quiz phase is about
      // to unmount in favor of the reveal screen, so there's nothing left
      // to re-enable it for.
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
  const currentQuestion = QUESTIONS[qIndex];

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

          {/* Defensive guard: only render the quiz once currentQuestion is a
              real object. If qIndex were ever out of range (shouldn't happen
              now that selectOption/goBack are locked during transitions,
              but this keeps a stray edge case from crashing the page) we
              simply render nothing for a frame instead of throwing. */}
          {phase === 'quiz' && currentQuestion && (
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
                    disabled={isAdvancing}
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
      className="delegateIntro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <span className="delegateIntro__badge">GLOBAL ARENA MUN 2026</span>
      <h1 className="delegateIntro__title">
        რა ტიპის <em>დელეგატი</em> ხარ?
      </h1>
      <p className="delegateIntro__desc">
        უპასუხე 8 მოკლე კითხვას და გაარკვიე, თუ რომელი დელეგატის ტიპი შეგეფერება შენ ყველაზე მეტად.
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
            disabled={disabled}
            onClick={() => onSelect(opt.type)}
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
// delegate type like a decelerating slot reel, then locks onto the real
// result with a burst of gold particles before handing off to ResultScreen.
function RevealScreen({ result, onComplete }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayType, setDisplayType] = useState(result);
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
      setDisplayType(result);
      setStage('locked');
      timers.push(setTimeout(() => !cancelled && onComplete(), 700));
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    const pool = TYPES.filter((t) => t.id !== result.id);
    let step = 0;

    const runStep = () => {
      if (cancelled) return;
      if (step < REVEAL_INTERVALS.length - 1) {
        const candidate = pool.length ? pool[Math.floor(Math.random() * pool.length)] : result;
        setDisplayType(candidate);
        step += 1;
        timers.push(setTimeout(runStep, REVEAL_INTERVALS[step]));
      } else {
        setDisplayType(result);
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
      className={`delegateReveal${locked ? ' delegateReveal--locked' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: EASE } }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="delegateReveal__stage">
        {!prefersReducedMotion && (
          <div
            className="delegateReveal__rings"
            aria-hidden="true"
          >
            <span className="delegateReveal__ring delegateReveal__ring--a" />
            <span className="delegateReveal__ring delegateReveal__ring--b" />
            <span className="delegateReveal__ring delegateReveal__ring--c" />
          </div>
        )}

        {locked && !prefersReducedMotion && (
          <>
            <motion.span
              className="delegateReveal__flash"
              initial={{ opacity: 0.9, scale: 0.6 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              aria-hidden="true"
            />
            {particles.map((p) => (
              <motion.span
                key={p.id}
                className="delegateReveal__particle"
                style={{ width: p.size, height: p.size }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
                transition={{ duration: 1.15, delay: p.delay, ease: 'easeOut' }}
                aria-hidden="true"
              />
            ))}
          </>
        )}

        <div className="delegateReveal__iconWrap">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={displayType.id}
              className="delegateReveal__icon"
              initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: locked ? 1.12 : 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: locked ? 0.5 : 0.12, ease: EASE }}
            >
              <i className={`bi ${displayType.icon}`} />
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="delegateReveal__caption">
          <AnimatePresence mode="wait">
            {!locked ? (
              <motion.p
                key="determining"
                className="delegateReveal__determining"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                ვადგენთ შენი დელეგატის ტიპს
                <span
                  className="delegateReveal__dots"
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
                <p className="delegateReveal__label">შენ ხარ</p>
                <h2 className="delegateReveal__name">{result.name}</h2>
                <p className="delegateReveal__tagline">{result.tagline}</p>
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
        className="delegateResult__registerLink"
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
              result ? `${result.name} — GLOBAL ARENA MUN 2026 დელეგატის ტიპის შედეგი` : 'შედეგის სურათი'
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