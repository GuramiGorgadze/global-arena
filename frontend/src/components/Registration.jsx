import { useState, useRef, useEffect, useMemo, cloneElement, isValidElement } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import * as api from '../api/api';

const COMMITTEES = [
  { id: 'unsc', name: 'UNSC' },
  { id: 'specpol', name: 'SPECPOL' },
  { id: 'unhrc', name: 'UNHRC' },
  { id: 'hcc', name: 'HCC' },
  { id: 'disec', name: 'DISEC (ENG)' },
  { id: 'presscorps', name: 'Press Corps' },
];

const STEPS = ['ინფორმაცია', 'ბექგრაუნდი', 'პრიორიტეტები', 'მიმოხილვა'];

const MIN_AGE = 10;
const MAX_AGE = 30;

const STORAGE_KEY = 'munReg:draft:v1';

const MAX = {
  firstName: 20,
  lastName: 20,
  email: 30,
  firstNameLatin: 20,
  lastNameLatin: 20,
  phone: 11,
  school: 40,
  nationalId: 11,
  facebook: 150,
  experience: 400,
  country: 30,
  parentName: 40,
  parentPhone: 11,
  promoCode: 20,
};

const PHONE_REGEX = /^5\d{2}-\d{3}-\d{3}$/;
const LATIN_NAME_REGEX = /^[A-Za-z\s'-]+$/;
const GEORGIAN_NAME_REGEX = /^[\u10A0-\u10FF\s'-]+$/;
const FACEBOOK_REGEX = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+/i;

const STEP_FIELDS = [
  [
    'firstName',
    'lastName',
    'firstNameLatin',
    'lastNameLatin',
    'email',
    'phone',
    'dob',
    'nationalId',
    'parentName',
    'parentPhone',
  ],
  ['school', 'facebook', 'experience'],
  ['committees'],
  [],
];

const DEFAULT_VALUES = {
  firstName: '',
  lastName: '',
  firstNameLatin: '',
  lastNameLatin: '',
  email: '',
  phone: '',
  dob: '',
  school: '',
  nationalId: '',
  facebook: '',
  experience: '',
  parentName: '',
  parentPhone: '',
  committees: ['', '', ''],
  countries: ['', '', ''],
  promoCode: '',
};

const schema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required('სახელი სავალდებულოა')
    .max(MAX.firstName, `მაქსიმუმ ${MAX.firstName} სიმბოლო`)
    .matches(GEORGIAN_NAME_REGEX, 'დაწერეთ სახელი ქართულად'),

  lastName: yup
    .string()
    .trim()
    .required('გვარი სავალდებულოა')
    .max(MAX.lastName, `მაქსიმუმ ${MAX.lastName} სიმბოლო`)
    .matches(GEORGIAN_NAME_REGEX, 'დაწერეთ გვარი ქართულად'),

  firstNameLatin: yup
    .string()
    .trim()
    .required('სახელი ლათინურად სავალდებულოა')
    .max(MAX.firstNameLatin, `მაქსიმუმ ${MAX.firstNameLatin} სიმბოლო`)
    .matches(LATIN_NAME_REGEX, 'დაწერეთ სახელი ლათინურად'),

  lastNameLatin: yup
    .string()
    .trim()
    .required('გვარი ლათინურად სავალდებულოა')
    .max(MAX.lastNameLatin, `მაქსიმუმ ${MAX.lastNameLatin} სიმბოლო`)
    .matches(LATIN_NAME_REGEX, 'დაწერეთ გვარი ლათინურად'),

  email: yup
    .string()
    .trim()
    .required('ელ. ფოსტა სავალდებულოა')
    .email('შეიყვანეთ ვალიდური ელ. ფოსტა')
    .max(MAX.email, `მაქსიმუმ ${MAX.email} სიმბოლო`),

  phone: yup
    .string()
    .trim()
    .required('ტელეფონის ნომერი სავალდებულოა')
    .matches(PHONE_REGEX, 'ფორმატი: 5XX-XXX-XXX'),

  dob: yup
    .string()
    .trim()
    .required('დაბადების თარიღი სავალდებულოა')
    .test('valid-date', 'შეიყვანეთ ვალიდური თარიღი', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return !Number.isNaN(date.getTime());
    })
    .test('age-range', `ასაკი უნდა იყოს ${MIN_AGE}-${MAX_AGE} წლის ფარგლებში`, (value) => {
      if (!value) return false;
      const dob = new Date(value);
      if (Number.isNaN(dob.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const hasHadBirthdayThisYear =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
      if (!hasHadBirthdayThisYear) age -= 1;
      return age >= MIN_AGE && age <= MAX_AGE;
    }),

  nationalId: yup
    .string()
    .trim()
    .required('პირადი ნომერი სავალდებულოა')
    .matches(/^\d{11}$/, 'პირადი ნომერი უნდა შეიცავდეს 11 ციფრს'),

  parentName: yup
    .string()
    .trim()
    .required('მშობლის სახელი სავალდებულოა')
    .max(MAX.parentName, `მაქსიმუმ ${MAX.parentName} სიმბოლო`),

  parentPhone: yup
    .string()
    .trim()
    .required('მშობლის ტელეფონის ნომერი სავალდებულოა')
    .matches(PHONE_REGEX, 'ფორმატი: 5XX-XXX-XXX'),

  school: yup
    .string()
    .trim()
    .required('სასწავლებელი სავალდებულოა')
    .max(MAX.school, `მაქსიმუმ ${MAX.school} სიმბოლო`),

  facebook: yup
    .string()
    .trim()
    .required('Facebook ბმული სავალდებულოა')
    .max(MAX.facebook, `მაქსიმუმ ${MAX.facebook} სიმბოლო`)
    .matches(FACEBOOK_REGEX, 'შეიყვანეთ ვალიდური Facebook ბმული'),

  experience: yup
    .string()
    .trim()
    .required('გამოცდილების აღწერა სავალდებულოა')
    .max(MAX.experience, `მაქსიმუმ ${MAX.experience} სიმბოლო`),

  committees: yup
    .array()
    .of(yup.string().required('აირჩიეთ კომიტეტი'))
    .length(3, 'აირჩიეთ სამივე კომიტეტი')
    .test('unique', 'კომიტეტები არ უნდა მეორდებოდეს', (arr) => {
      if (!arr) return true;
      const filled = arr.filter(Boolean);
      return new Set(filled).size === filled.length;
    }),

  countries: yup.array().of(yup.string()),

  promoCode: yup.string().trim().max(MAX.promoCode, `მაქსიმუმ ${MAX.promoCode} სიმბოლო`),
});

const getFirstErrorStep = (formErrors) => {
  const erroredFields = Object.keys(formErrors);
  for (let s = 0; s < STEP_FIELDS.length; s++) {
    if (STEP_FIELDS[s].some((f) => erroredFields.includes(f))) {
      return s;
    }
  }
  return 0;
};

const loadDraft = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveDraft = (values, step) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, step, savedAt: Date.now() }));
  } catch {}
};

const clearDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

const FOCUSABLE_FIELD_SELECTOR =
  'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly])';

const EASE = [0.22, 1, 0.36, 1];

const stepVariants = {
  enter: (dir) => ({
    opacity: 0,
    x: dir >= 0 ? 48 : -48,
    filter: 'blur(6px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EASE },
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir >= 0 ? -48 : 48,
    filter: 'blur(6px)',
    transition: { duration: 0.32, ease: [0.4, 0, 1, 1] },
  }),
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } },
};

const SHAKE_KEYFRAMES = { x: [0, -9, 8, -6, 5, -3, 2, 0] };

function FloatingParticles() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 1000) / 10,
        size: 2 + Math.random() * 3,
        duration: 14 + Math.random() * 12,
        delay: Math.random() * -20,
        drift: (Math.random() - 0.5) * 60,
      })),
    []
  );

  if (prefersReducedMotion) return null;

  return (
    <div
      className="ambientParticles"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="ambientParticles__dot"
          style={{ left: `${p.left}%`, width: p.size, height: p.size }}
          animate={{
            y: ['0vh', '-105vh'],
            x: [0, p.drift],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export default function RegistrationPage() {
  const formTopRef = useRef(null);
  const stepContentRef = useRef(null);
  const cardControls = useAnimation();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [draftRestored, setDraftRestored] = useState(false);
  const experienceText = watch('experience') || '';

  const committees = watch('committees');
  const countries = watch('countries');

  // react-hook-form only applies `reValidateMode` once `formState.isSubmitted`
  // is true, and `isSubmitted` is only ever set by an actual `handleSubmit()`
  // call. Because this is a multi-step form, steps are validated with
  // `trigger()` (see nextStep below), so `isSubmitted` stays false until the
  // very last step — meaning plain `register()` fields would otherwise never
  // live-revalidate while typing, no matter what reValidateMode says.
  //
  // We work around this below by manually re-triggering validation for a
  // field whenever it changes and already has a visible error. Keeping the
  // latest `errors` in a ref (rather than a dependency of the watch effect)
  // means we don't need to tear down and recreate the subscription on every
  // keystroke that changes error state.
  const errorsRef = useRef(errors);
  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  useEffect(() => {
    const draft = loadDraft();
    if (draft?.values) {
      reset({ ...DEFAULT_VALUES, ...draft.values });
      if (typeof draft.step === 'number') {
        setStep(Math.min(Math.max(draft.step, 0), STEPS.length - 1));
      }
      setDraftRestored(true);
      toast('ფორმა აღდგენილია', { icon: '📝' });
    }
  }, []);

  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        return;
      }
      saveDraft(values, step);

      // Live-revalidate whichever field just changed, but only if it (or its
      // parent, e.g. the `committees` array) currently has an error — this
      // mirrors what reValidateMode: 'onChange' is supposed to do on its own.
      if (name) {
        const topLevelKey = name.split('.')[0];
        if (errorsRef.current[topLevelKey]) {
          trigger(name);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, step, trigger]);

  const handlePhoneChange = (name) => (e) => {
    let digits = e.target.value.replace(/\D/g, '').substring(0, 9);
    let formatted = digits;
    if (digits.length > 3) formatted = digits.substring(0, 3) + '-' + digits.substring(3);
    if (digits.length > 6) formatted = formatted.substring(0, 7) + '-' + digits.substring(6, 9);
    setValue(name, formatted, { shouldDirty: true });
  };

  const handleDigitsChange = (name, maxDigits) => (e) => {
    const digits = e.target.value.replace(/\D/g, '').substring(0, maxDigits);
    setValue(name, digits, { shouldDirty: true });
  };

  const setCommitteeAt = (i, value) => {
    const next = [...committees];
    next[i] = value;
    setValue('committees', next, { shouldDirty: true });
  };

  const nextStep = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) {
      cardControls.start({
        x: SHAKE_KEYFRAMES.x,
        transition: { duration: 0.45, ease: 'easeInOut' },
      });
      scrollTop();
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollTop();
  };

  const onInvalid = (formErrors) => {
    const targetStep = getFirstErrorStep(formErrors);
    if (targetStep !== step) {
      setDirection(targetStep > step ? 1 : -1);
      setStep(targetStep);
    }
    cardControls.start({ x: SHAKE_KEYFRAMES.x, transition: { duration: 0.45, ease: 'easeInOut' } });
    scrollTop();
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  };

  const scrollTop = () => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFormKeyDown = (e) => {
    if (e.key !== 'Enter') return;

    // Let Enter insert a normal newline inside the experience textarea
    // instead of hijacking it to advance/submit the form.
    if (e.target.tagName === 'TEXTAREA') return;

    e.preventDefault();

    if (isSubmitting) return;

    const container = stepContentRef.current;
    const focusable = container
      ? Array.from(container.querySelectorAll(FOCUSABLE_FIELD_SELECTOR))
      : [];
    const currentIndex = focusable.indexOf(e.target);

    if (currentIndex !== -1) {
      const nextField = focusable[currentIndex + 1];
      if (nextField) {
        nextField.focus();
        if (nextField.tagName === 'INPUT' && typeof nextField.select === 'function') {
          nextField.select();
        }
        return;
      }
    }

    if (step < STEPS.length - 1) {
      nextStep();
    } else {
      handleSubmit(onSubmit, onInvalid)();
    }
  };

  const handleClearDraft = () => {
    skipNextSaveRef.current = true;
    clearDraft();
    reset(DEFAULT_VALUES);
    setDirection(-1);
    setStep(0);
    setDraftRestored(false);
    toast('ფორმა გასუფთავდა', { icon: '🗑️' });
    scrollTop();
  };

  const onSubmit = async (data) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      firstNameLatin: data.firstNameLatin,
      lastNameLatin: data.lastNameLatin,
      email: data.email,
      phone: data.phone,
      dob: data.dob,
      school: data.school,
      nationalId: data.nationalId,
      facebook: data.facebook,
      experience: data.experience,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      committees: data.committees,
      countries: data.countries,
      promoCode: data.promoCode?.trim() || '',
    };

    const toastId = toast.loading('რეგისტრაცია მიმდინარეობს...');

    try {
      await api.registerDelegate(payload);
      toast.success('წარმატებით დარეგისტრირდით!', { id: toastId });
      skipNextSaveRef.current = true;
      clearDraft();
      reset(DEFAULT_VALUES);
      setDirection(-1);
      setStep(0);
      setDraftRestored(false);
      scrollTop();
    } catch (err) {
      const message = err?.message || 'რეგისტრაცია ვერ მოხერხდა, სცადეთ ხელახლა.';
      toast.error(message, { id: toastId });
      setError('root.serverError', { message });
      cardControls.start({
        x: SHAKE_KEYFRAMES.x,
        transition: { duration: 0.45, ease: 'easeInOut' },
      });
      scrollTop();
    }
  };

  const committeeName = (id) => COMMITTEES.find((c) => c.id === id)?.name || '—';

  return (
    <div className="munReg">
      <FloatingParticles />
      <section
        className="formSection"
        id="register"
        ref={formTopRef}
      >
        <motion.div
          className="sectionHeader"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <h2>
            გახდი შემდეგი <em>დელეგატი</em>
          </h2>
          <p>რეგისტრაციისთვის შეავსეთ ქვემოთ მოცემული ფორმა</p>
        </motion.div>

        <motion.div
          className="formCard"
          animate={cardControls}
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <div className="formSteps">
            {STEPS.map((label, i) => (
              <div
                className="formSteps__group"
                key={label}
              >
                {i < STEPS.length - 1 && (
                  <div className="formSteps__line">
                    <motion.div
                      className="formSteps__lineFill"
                      initial={false}
                      animate={{ scaleX: i < step ? 1 : 0 }}
                      transition={{ duration: 0.55, ease: EASE }}
                    />
                  </div>
                )}
                <div
                  className={`formSteps__step ${i === step ? 'formSteps__step--active' : ''} ${i < step ? 'formSteps__step--done' : ''}`}
                >
                  <motion.div
                    className="formSteps__num"
                    animate={
                      i === step
                        ? { scale: [1, 1.18, 1], boxShadow: '0 0 20px rgba(212,175,90,0.45)' }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <AnimatePresence
                      mode="wait"
                      initial={false}
                    >
                      {i < step ? (
                        <motion.i
                          key="check"
                          className="bi bi-check-lg"
                          initial={{ scale: 0, rotate: -120, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 480, damping: 22 }}
                        />
                      ) : (
                        <motion.span
                          key="num"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          {i + 1}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <span className="formSteps__label">{label}</span>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {draftRestored && (
              <motion.div
                className="formDraftBanner"
                role="status"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 28 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <span>
                  <i className="bi bi-clock-history" /> ფორმა აღდგენილია
                </span>
                <motion.button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleClearDraft}
                >
                  გასუფთავება
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            onKeyDown={handleFormKeyDown}
          >
            <AnimatePresence
              mode="wait"
              custom={direction}
              initial={false}
            >
              <motion.div
                className="formStepContent"
                key={step}
                ref={stepContentRef}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {step === 0 && (
                  <>
                    <div className="formDivider">
                      <span>ინფორმაცია</span>
                    </div>
                    <motion.div
                      className="formGrid formGrid--2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Field
                        id="firstName"
                        label="სახელი (ქართულად)"
                        required
                        error={errors.firstName?.message}
                      >
                        <input
                          className={clsx('formInput', { error: errors.firstName })}
                          placeholder="შეიყვანეთ სახელი"
                          maxLength={MAX.firstName}
                          {...register('firstName')}
                        />
                      </Field>
                      <Field
                        id="lastName"
                        label="გვარი (ქართულად)"
                        required
                        error={errors.lastName?.message}
                      >
                        <input
                          className={clsx('formInput', { error: errors.lastName })}
                          placeholder="შეიყვანეთ გვარი"
                          maxLength={MAX.lastName}
                          {...register('lastName')}
                        />
                      </Field>
                      <Field
                        id="firstNameLatin"
                        label="სახელი ლათინურად"
                        required
                        error={errors.firstNameLatin?.message}
                      >
                        <input
                          className={clsx('formInput', { error: errors.firstNameLatin })}
                          placeholder="Enter First Name"
                          maxLength={MAX.firstNameLatin}
                          {...register('firstNameLatin')}
                        />
                      </Field>
                      <Field
                        id="lastNameLatin"
                        label="გვარი ლათინურად"
                        required
                        error={errors.lastNameLatin?.message}
                      >
                        <input
                          className={clsx('formInput', { error: errors.lastNameLatin })}
                          placeholder="Enter Last Name"
                          maxLength={MAX.lastNameLatin}
                          {...register('lastNameLatin')}
                        />
                      </Field>
                      <Field
                        id="email"
                        label="ელ. ფოსტის მისამართი"
                        required
                        error={errors.email?.message}
                      >
                        <input
                          type="email"
                          className={clsx('formInput', { error: errors.email })}
                          placeholder="შეიყვანეთ ელ. ფოსტა"
                          maxLength={MAX.email}
                          {...register('email')}
                        />
                      </Field>
                      <Field
                        id="phone"
                        label="ტელეფონის ნომერი"
                        required
                        error={errors.phone?.message}
                      >
                        <input
                          type="tel"
                          inputMode="numeric"
                          className={clsx('formInput', { error: errors.phone })}
                          placeholder="5XX-XXX-XXX"
                          maxLength={MAX.phone}
                          value={watch('phone')}
                          onChange={handlePhoneChange('phone')}
                        />
                      </Field>
                      <Field
                        id="dob"
                        label="დაბადების თარიღი"
                        required
                        error={errors.dob?.message}
                      >
                        <input
                          type="date"
                          className={clsx('formInput', { error: errors.dob })}
                          placeholder="შეიყვანეთ დაბადების თარიღი"
                          {...register('dob')}
                          required
                        />
                      </Field>
                      <Field
                        id="nationalId"
                        label="პირადი ნომერი"
                        required
                        error={errors.nationalId?.message}
                      >
                        <input
                          inputMode="numeric"
                          className={clsx('formInput', { error: errors.nationalId })}
                          placeholder="შეიყვანეთ პირადი ნომერი"
                          maxLength={MAX.nationalId}
                          value={watch('nationalId')}
                          onChange={handleDigitsChange('nationalId', MAX.nationalId)}
                        />
                      </Field>
                    </motion.div>

                    <div className="formDivider">
                      <span>მშობლის ინფორმაცია</span>
                    </div>
                    <motion.div
                      className="formGrid formGrid--2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Field
                        id="parentName"
                        label="მშობლის სრული სახელი"
                        required
                        error={errors.parentName?.message}
                      >
                        <input
                          className={clsx('formInput', { error: errors.parentName })}
                          placeholder="სრული სახელი"
                          maxLength={MAX.parentName}
                          {...register('parentName')}
                        />
                      </Field>
                      <Field
                        id="parentPhone"
                        label="მშობლის ტელეფონის ნომერი"
                        required
                        error={errors.parentPhone?.message}
                      >
                        <input
                          type="tel"
                          inputMode="numeric"
                          className={clsx('formInput', { error: errors.parentPhone })}
                          placeholder="5XX-XXX-XXX"
                          maxLength={MAX.parentPhone}
                          value={watch('parentPhone')}
                          onChange={handlePhoneChange('parentPhone')}
                        />
                      </Field>
                    </motion.div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="formDivider">
                      <span>ბექგრაუნდი</span>
                    </div>
                    <motion.div
                      className="formGrid formGrid--2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Field
                        id="school"
                        label="სკოლა / უნივერსიტეტი"
                        required
                        error={errors.school?.message}
                      >
                        <input
                          className={clsx('formInput', { error: errors.school })}
                          placeholder="სასწავლებლის დასახელება"
                          maxLength={MAX.school}
                          {...register('school')}
                        />
                      </Field>
                      <Field
                        id="facebook"
                        label="Facebook გვერდის ბმული"
                        required
                        error={errors.facebook?.message}
                      >
                        <input
                          className={clsx('formInput facebookInput', { error: errors.facebook })}
                          placeholder="facebook.com/username"
                          maxLength={MAX.facebook}
                          {...register('facebook')}
                        />
                      </Field>
                    </motion.div>

                    <motion.div
                      className="formGrid formGrid--1"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Field
                        id="experience"
                        label="MUN გამოცდილება"
                        required
                        error={errors.experience?.message}
                      >
                        <div className="textareaWrap">
                          <textarea
                            className={clsx('formTextarea', { error: errors.experience })}
                            placeholder="აღწერეთ თქვენი გაეროს მოდელირების ან მსგავსი პროექტების გამოცდილება. რომელ კონფერენციებში მიგიღიათ მონაწილეობა და რა როლით"
                            rows={5}
                            maxLength={MAX.experience}
                            {...register('experience')}
                          />
                          <div className="textareaFooter">
                            <span
                              className={clsx('charCounter', {
                                'charCounter--nearMax': experienceText.length > 350,
                              })}
                            >
                              {experienceText.length} / {MAX.experience}
                            </span>
                          </div>
                        </div>
                      </Field>
                    </motion.div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="formDivider">
                      <span>სასურველი 3 კომიტეტი და ქვეყანა</span>
                    </div>
                    <p className="formNote">
                      აირჩიეთ თქვენი სასუველი კომიტეტები და ქვეყნები პრიორიტის მიხედვით. <br /> ჩვენ
                      მაქსიმალურად შევეცდებით გავითვალისწინოთ თქვენი არჩევანი.
                    </p>
                    <motion.div
                      className="formGrid formGrid--3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {committees.map((val, i) => (
                        <Field
                          id={`committee-${i}`}
                          label={`კომიტეტი ${i + 1}`}
                          key={i}
                          required
                          error={errors.committees?.[i]?.message}
                        >
                          <select
                            className={clsx('formSelect', { error: errors.committees?.[i] })}
                            value={val}
                            onChange={(e) => setCommitteeAt(i, e.target.value)}
                          >
                            <option value="">აირჩიეთ კომიტეტი…</option>
                            {COMMITTEES.filter(
                              (c) => !committees.includes(c.id) || c.id === val
                            ).map((c) => (
                              <option
                                key={c.id}
                                value={c.id}
                              >
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      ))}
                    </motion.div>
                    {/* Group-level error (wrong count / duplicates) rendered once,
                        not attached to any single dropdown. */}
                    {typeof errors.committees?.message === 'string' && (
                      <motion.p
                        className="formError"
                        role="alert"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.committees.message}
                      </motion.p>
                    )}

                    <motion.div
                      className="formGrid formGrid--3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Field
                        id="country-0"
                        label="ქვეყანა 1"
                      >
                        <input
                          className="formInput"
                          placeholder="მაგ. საფრანგეთი"
                          maxLength={MAX.country}
                          {...register('countries.0')}
                        />
                      </Field>
                      <Field
                        id="country-1"
                        label="ქვეყანა 2"
                      >
                        <input
                          className="formInput"
                          placeholder="მაგ. იაპონია"
                          maxLength={MAX.country}
                          {...register('countries.1')}
                        />
                      </Field>
                      <Field
                        id="country-2"
                        label="ქვეყანა 3"
                      >
                        <input
                          className="formInput"
                          placeholder="მაგ. ბრაზილია"
                          maxLength={MAX.country}
                          {...register('countries.2')}
                        />
                      </Field>
                    </motion.div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="formDivider">
                      <span>მიმოხილვა და დადასტურება</span>
                    </div>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <SummaryCard
                        title="პირადი ინფორმაცია"
                        rows={[
                          [
                            'სახელი (ქართულად)',
                            `${watch('firstName')} ${watch('lastName')}`.trim() || '—',
                          ],
                          [
                            'სახელი (ლათინურად)',
                            `${watch('firstNameLatin')} ${watch('lastNameLatin')}`.trim() || '—',
                          ],
                          ['ელ. ფოსტა', watch('email') || '—'],
                          ['ტელეფონი', watch('phone') || '—'],
                          ['დაბადების თარიღი', watch('dob') || '—'],
                          ['პირადი ნომერი', watch('nationalId') || '—'],
                          [
                            'მშობელი',
                            watch('parentName')
                              ? `${watch('parentName')} (${watch('parentPhone') || '—'})`
                              : '—',
                          ],
                        ]}
                      />
                      <SummaryCard
                        title="ბექგრაუნდი"
                        rows={[
                          ['სკოლა / უნივერსიტეტი', watch('school') || '—'],
                          ['Facebook', watch('facebook') || '—'],
                          ['გამოცდილება', watch('experience') || '—'],
                        ]}
                      />
                      <SummaryCard
                        title="სასურველი კომიტეტები"
                        rows={committees.map((c, i) => [`კომიტეტი ${i + 1}`, committeeName(c)])}
                      />
                      <SummaryCard
                        title="სასურველი ქვეყნები"
                        rows={countries.map((c, i) => [`ქვეყანა ${i + 1}`, c || '—'])}
                      />
                    </motion.div>
                    <div className="formGrid formGrid--1">
                      <Field
                        id="promoCode"
                        label="პრომო კოდი"
                        error={errors.promoCode?.message}
                      >
                        <input
                          className={clsx('formInput', { error: errors.promoCode })}
                          placeholder="შეიყვანეთ პრომო კოდი, თუ გაქვთ"
                          maxLength={MAX.promoCode}
                          {...register('promoCode')}
                        />
                      </Field>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {errors.root?.serverError?.message && (
              <motion.p
                className="formError formError--root"
                role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.root.serverError.message}
              </motion.p>
            )}

            <div className="formFooter">
              <div className="formFooter__left">
                <AnimatePresence>
                  {step > 0 && (
                    <motion.button
                      type="button"
                      className="btn btn--ghost"
                      onClick={prevStep}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      whileHover={{ x: -3 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                    >
                      <i className="bi bi-arrow-left" /> უკან
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div className="formFooter__right">
                <span className="formFooter__count">
                  ნაბიჯი {step + 1} / {STEPS.length}
                </span>
                {step < STEPS.length - 1 ? (
                  <motion.button
                    key="next-btn"
                    type="button"
                    className="submitBtn"
                    onClick={nextStep}
                    whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(212,175,90,0.4)' }}
                    whileTap={{ scale: 0.97, y: 0 }}
                  >
                    გაგრძელება <i className="bi bi-arrow-right" />
                  </motion.button>
                ) : (
                  <motion.button
                    key="submit-btn"
                    type="submit"
                    className="submitBtn"
                    disabled={isSubmitting}
                    whileHover={
                      !isSubmitting ? { y: -2, boxShadow: '0 10px 40px rgba(212,175,90,0.4)' } : {}
                    }
                    whileTap={!isSubmitting ? { scale: 0.97, y: 0 } : {}}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.span
                          className="submitBtn__spinner"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                        />
                        იგზავნება...
                      </>
                    ) : (
                      <>
                        გაგზავნა <i className="bi bi-arrow-right" />
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </section>
    </div>
  );
}

function Field({ label, required, error, children, id }) {
  const errorId = error ? `${id}-error` : undefined;
  const child = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': errorId,
      })
    : children;

  return (
    <motion.div
      className="formGroup"
      variants={itemVariants}
    >
      <label
        className="formLabel"
        htmlFor={id}
      >
        {label} {required && <span className="formLabel__req">*</span>}
      </label>
      {child}
      <AnimatePresence>
        {error && (
          <motion.p
            className="formError"
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SummaryCard({ title, rows }) {
  return (
    <motion.div
      className="summaryCard"
      variants={itemVariants}
    >
      <p className="summaryCard__title">{title}</p>
      <div className="summaryCard__grid">
        {rows.map(([k, v]) => (
          <div key={k}>
            <span className="summaryCard__key">{k}</span>
            <span className="summaryCard__val">{v}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
