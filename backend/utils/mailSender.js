import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_SENDER_EMAIL,
      pass: process.env.MAIL_SENDER_PASS,
    },
  });

const COMMITTEE_NAMES = {
  unsc: "UNSC",
  specpol: "SPECPOL",
  unhrc: "UNHRC",
  hcc: "HCC",
  disec: "DISEC",
};

const committeeLabel = (id) => COMMITTEE_NAMES[id] || id || "—";

const emailShell = (tagLabel, bodyHtml) => `
  <div style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: Georgia, 'Times New Roman', serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F0E8; padding: 30px 16px;">
      <tr>
        <td align="center">
          <table width="580" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%;">
            <tr>
              <td align="center" style="padding-bottom: 8px;">
                <div style="display: inline-block; border-bottom: 1px solid #c9a84c; padding-bottom: 12px; margin-bottom: 6px;">
                  <span style="font-size: 26px; color: #0F0F0F; letter-spacing: 3px; font-weight: normal; text-transform: uppercase;">GLOBAL ARENA</span>
                </div>
                <p style="color: #9a7a35; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 6px 0 0 0;">${tagLabel}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 14px 0;">
                <div style="width: 40px; height: 1px; background-color: #c9a84c; display: inline-block;"></div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #FFFFFF; border: 1px solid #e8e0d0; padding: 30px 24px; border-radius: 12px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 24px 0 0 0;">
                <p style="color: #b0a090; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px 0;">© ${new Date().getFullYear()} GLOBAL ARENA</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding: 10px 14px; background-color: #fdf8f0; border-left: 2px solid #c9a84c; border-radius: 4px;">
      <p style="margin: 0 0 3px 0; color: #9a7a35; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">${label}</p>
      <p style="margin: 0; color: #0F0F0F; font-size: 14px;">${value}</p>
    </td>
  </tr>
  <tr><td style="height: 8px; line-height: 8px; font-size: 0;">&nbsp;</td></tr>
`;

const sendDelegateConfirmationMail = async (delegate) => {
  const transporter = createTransporter();

  const committeesHtml = delegate.committees
    .map((c, i) => infoRow(`კომიტეტი ${i + 1}`, committeeLabel(c)))
    .join("");

  const countriesHtml = delegate.countries
    .map((c, i) => infoRow(`ქვეყანა ${i + 1}`, c || "—"))
    .join("");

  const body = `
    <p style="color: #9a7a35; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 20px 0;">რეგისტრაცია მიღებულია</p>
    <p style="color: #0F0F0F; font-size: 16px; line-height: 1.7; margin: 0 0 12px 0;">
      გამარჯობა, ${delegate.firstName}!
    </p>
    <p style="color: #6a5f52; font-size: 14px; line-height: 1.7; margin: 0 0 26px 0;">
      თქვენი აპლიკაცია წარმატებით მივიღეთ. ქვემოთ იხილავთ თქვენს მიერ მითითებულ ინფორმაციას.
    </p>

    <p style="color: #9a7a35; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px 0;">სასურველი კომიტეტები</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
      ${committeesHtml}
    </table>

    <p style="color: #9a7a35; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px 0;">სასურველი ქვეყნები</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 6px;">
      ${countriesHtml}
    </table>

    <div style="border-top: 1px solid #e8e0d0; margin: 28px 0 18px 0;"></div>
    <p style="color: #b0a090; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
      გადახდის შესახებ დამატებით შეტყობინებას მიიღებთ მოგვიანებით.
    </p>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_SENDER_EMAIL,
    to: delegate.email,
    subject: "[GLOBAL ARENA] რეგისტრაცია დადასტურებულია",
    html: emailShell("Registration Confirmed", body),
  });
};

const sendAdminNotificationMail = async (delegate) => {
  const transporter = createTransporter();

  const body = `
    <p style="color: #9a7a35; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 20px 0;">ახალი დელეგატი</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 6px;">
      ${infoRow("სახელი და გვარი", `${delegate.firstName} ${delegate.lastName}`)}
      ${infoRow("ელ. ფოსტა", `<a href="mailto:${delegate.email}" style="color: #9a7a35;">${delegate.email}</a>`)}
      ${infoRow("ტელეფონი", delegate.phone)}
      ${infoRow("დაბადების თარიღი", delegate.dob)}
      ${infoRow("პირადი ნომერი", delegate.nationalId)}
      ${infoRow("მშობელი", `${delegate.parentName} (${delegate.parentPhone})`)}
      ${infoRow("სასწავლებელი", delegate.school)}
      ${infoRow("Facebook", delegate.facebook)}
      ${delegate.committees.map((c, i) => infoRow(`კომიტეტი ${i + 1}`, committeeLabel(c))).join("")}
      ${delegate.countries.map((c, i) => infoRow(`ქვეყანა ${i + 1}`, c || "—")).join("")}
    </table>

    <p style="color: #9a7a35; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 18px 0 10px 0;">გამოცდილება</p>
    <div style="background-color: #fdf8f0; border: 1px solid #e8e0d0; padding: 16px 18px; border-radius: 4px;">
      <p style="color: #0F0F0F; font-size: 14px; line-height: 1.7; margin: 0;">${delegate.experience}</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_SENDER_EMAIL,
    to: process.env.MAIL_SENDER_EMAIL,
    replyTo: delegate.email,
    subject: "[GLOBAL ARENA] ახალი დელეგატის რეგისტრაცია",
    html: emailShell("New Registration", body),
  });
};

export { sendDelegateConfirmationMail, sendAdminNotificationMail };