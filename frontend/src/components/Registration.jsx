import { useState, useRef, cloneElement, isValidElement } from 'react';
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
  { id: 'disec', name: 'DISEC' },
  { id: 'presscorps', name: 'Press Corps' },
];

const STEPS = ['ინფორმაცია', 'ბექგრაუნდი', 'პრიორიტეტები', 'მიმოხილვა'];

const MIN_AGE = 10;
const MAX_AGE = 30;

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
  ['committees', 'countries'],
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
    .matches(GEORGIAN_NAME_REGEX, 'მხოლოდ ქართული ასოები'),

  lastName: yup
    .string()
    .trim()
    .required('გვარი სავალდებულოა')
    .max(MAX.lastName, `მაქსიმუმ ${MAX.lastName} სიმბოლო`)
    .matches(GEORGIAN_NAME_REGEX, 'გამოიყენეთ მხოლოდ ქართული ასოები'),

  firstNameLatin: yup
    .string()
    .trim()
    .required('სახელი ლათინურად სავალდებულოა')
    .max(MAX.firstNameLatin, `მაქსიმუმ ${MAX.firstNameLatin} სიმბოლო`)
    .matches(LATIN_NAME_REGEX, 'გამოიყენეთ მხოლოდ ლათინური ასოები'),

  lastNameLatin: yup
    .string()
    .trim()
    .required('გვარი ლათინურად სავალდებულოა')
    .max(MAX.lastNameLatin, `მაქსიმუმ ${MAX.lastNameLatin} სიმბოლო`)
    .matches(LATIN_NAME_REGEX, 'გამოიყენეთ მხოლოდ ლათინური ასოები'),

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

  countries: yup
    .array()
    .of(yup.string().trim().max(MAX.country, `მაქსიმუმ ${MAX.country} სიმბოლო`))
    .test('unique', 'ქვეყნები არ უნდა მეორდებოდეს', (arr) => {
      if (!arr) return true;
      const filled = arr.map((c) => (c || '').trim().toLowerCase()).filter(Boolean);
      return new Set(filled).size === filled.length;
    }),

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

export default function RegistrationPage() {
  const formTopRef = useRef(null);
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
  const experienceText = watch('experience') || '';

  const committees = watch('committees');
  const countries = watch('countries');

  const handlePhoneChange = (name) => (e) => {
    let digits = e.target.value.replace(/\D/g, '').substring(0, 9);
    let formatted = digits;
    if (digits.length > 3) formatted = digits.substring(0, 3) + '-' + digits.substring(3);
    if (digits.length > 6) formatted = formatted.substring(0, 7) + '-' + digits.substring(6, 9);
    setValue(name, formatted, {
      shouldValidate: Boolean(errors[name]),
      shouldDirty: true,
    });
  };

  const handleDigitsChange = (name, maxDigits) => (e) => {
    const digits = e.target.value.replace(/\D/g, '').substring(0, maxDigits);
    setValue(name, digits, {
      shouldValidate: Boolean(errors[name]),
      shouldDirty: true,
    });
  };

  const setCommitteeAt = (i, value) => {
    const next = [...committees];
    next[i] = value;
    setValue('committees', next, {
      shouldValidate: Boolean(errors.committees),
      shouldDirty: true,
    });
  };

  const nextStep = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) {
      scrollTop();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollTop();
  };

  // Jumps back to whichever step actually contains the invalid field,
  // instead of just scrolling up on the current (possibly unrelated) step.
  const onInvalid = (formErrors) => {
    const targetStep = getFirstErrorStep(formErrors);
    if (targetStep !== step) {
      setStep(targetStep);
    }
    scrollTop();
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  };

  const scrollTop = () => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFormKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();

    if (isSubmitting) return;

    if (step < STEPS.length - 1) {
      nextStep();
    } else {
      handleSubmit(onSubmit, onInvalid)();
    }
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
      reset(DEFAULT_VALUES);
      setStep(0);
      scrollTop();
    } catch (err) {
      const message = err?.message || 'რეგისტრაცია ვერ მოხერხდა, სცადეთ ხელახლა.';
      toast.error(message, { id: toastId });
      setError('root.serverError', { message });
      scrollTop();
    }
  };

  const committeeName = (id) => COMMITTEES.find((c) => c.id === id)?.name || '—';

  return (
    <div className="munReg">
      <section
        className="formSection"
        id="register"
        ref={formTopRef}
      >
        <div className="sectionHeader">
          <h2>
            გახდი შემდეგი <em>დელეგატი</em>
          </h2>
          <p>რეგისტრაციისთვის შეავსეთ ქვემოთ მოცემული ფორმა</p>
        </div>

        <div className="formCard">
          <div className="formSteps">
            {STEPS.map((label, i) => (
              <div
                className="formSteps__group"
                key={label}
              >
                {i < STEPS.length - 1 && (
                  <div className={`formSteps__line ${i < step ? 'formSteps__line--done' : ''}`} />
                )}
                <div
                  className={`formSteps__step ${i === step ? 'formSteps__step--active' : ''} ${i < step ? 'formSteps__step--done' : ''}`}
                >
                  <div className="formSteps__num">
                    {i < step ? <i className="bi bi-check-lg" /> : i + 1}
                  </div>
                  <span className="formSteps__label">{label}</span>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            onKeyDown={handleFormKeyDown}
          >
            <div
              className="formStepContent"
              key={step}
            >
              {step === 0 && (
                <>
                  <div className="formDivider">
                    <span>ინფორმაცია</span>
                  </div>
                  <div className="formGrid formGrid--2">
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
                        placeholder="MM/DD/YYYY"
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
                  </div>

                  <div className="formDivider">
                    <span>მშობლის ინფორმაცია</span>
                  </div>
                  <div className="formGrid formGrid--2">
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
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="formDivider">
                    <span>ბექგრაუნდი</span>
                  </div>
                  <div className="formGrid formGrid--2">
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
                        className={clsx('formInput', { error: errors.facebook })}
                        placeholder="facebook.com/username"
                        maxLength={MAX.facebook}
                        {...register('facebook')}
                      />
                    </Field>
                  </div>

                  <div className="formGrid formGrid--1">
                    <Field
                      id="experience"
                      label="MUN გამოცდილება"
                      required
                      error={errors.experience?.message}
                    >
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
                    </Field>
                  </div>
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
                  <div className="formGrid formGrid--3">
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
                          {COMMITTEES.filter((c) => !committees.includes(c.id) || c.id === val).map(
                            (c) => (
                              <option
                                key={c.id}
                                value={c.id}
                              >
                                {c.name}
                              </option>
                            )
                          )}
                        </select>
                      </Field>
                    ))}
                  </div>
                  {/* Group-level error (wrong count / duplicates) rendered once,
                      not attached to any single dropdown. */}
                  {typeof errors.committees?.message === 'string' && (
                    <p
                      className="formError"
                      role="alert"
                    >
                      {errors.committees.message}
                    </p>
                  )}

                  <div className="formGrid formGrid--3">
                    <Field
                      id="country-0"
                      label="ქვეყანა 1"
                      error={errors.countries?.[0]?.message}
                    >
                      <input
                        className={clsx('formInput', { error: errors.countries?.[0] })}
                        placeholder="მაგ. საფრანგეთი"
                        maxLength={MAX.country}
                        {...register('countries.0')}
                      />
                    </Field>
                    <Field
                      id="country-1"
                      label="ქვეყანა 2"
                      error={errors.countries?.[1]?.message}
                    >
                      <input
                        className={clsx('formInput', { error: errors.countries?.[1] })}
                        placeholder="მაგ. იაპონია"
                        maxLength={MAX.country}
                        {...register('countries.1')}
                      />
                    </Field>
                    <Field
                      id="country-2"
                      label="ქვეყანა 3"
                      error={errors.countries?.[2]?.message}
                    >
                      <input
                        className={clsx('formInput', { error: errors.countries?.[2] })}
                        placeholder="მაგ. ბრაზილია"
                        maxLength={MAX.country}
                        {...register('countries.2')}
                      />
                    </Field>
                  </div>
                  {typeof errors.countries?.message === 'string' && (
                    <p
                      className="formError"
                      role="alert"
                    >
                      {errors.countries.message}
                    </p>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <div className="formDivider">
                    <span>მიმოხილვა და დადასტურება</span>
                  </div>
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
            </div>

            {errors.root?.serverError?.message && (
              <p
                className="formError formError--root"
                role="alert"
              >
                {errors.root.serverError.message}
              </p>
            )}

            <div className="formFooter">
              <div className="formFooter__left">
                {step > 0 && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={prevStep}
                  >
                    <i className="bi bi-arrow-left" /> უკან
                  </button>
                )}
              </div>
              <div className="formFooter__right">
                <span className="formFooter__count">
                  ნაბიჯი {step + 1} / {STEPS.length}
                </span>
                {step < STEPS.length - 1 ? (
                  <button
                    key="next-btn"
                    type="button"
                    className="submitBtn"
                    onClick={nextStep}
                  >
                    გაგრძელება <i className="bi bi-arrow-right" />
                  </button>
                ) : (
                  <button
                    key="submit-btn"
                    type="submit"
                    className="submitBtn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'იგზავნება...' : 'გაგზავნა'} <i className="bi bi-arrow-right" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
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
    <div className="formGroup">
      <label
        className="formLabel"
        htmlFor={id}
      >
        {label} {required && <span className="formLabel__req">*</span>}
      </label>
      {child}
      {error && (
        <p
          className="formError"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function SummaryCard({ title, rows }) {
  return (
    <div className="summaryCard">
      <p className="summaryCard__title">{title}</p>
      <div className="summaryCard__grid">
        {rows.map(([k, v]) => (
          <div key={k}>
            <span className="summaryCard__key">{k}</span>
            <span className="summaryCard__val">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
