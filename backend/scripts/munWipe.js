// ---------------------------------------------------------------------------
// Wipe the MUN console back to the state it shipped in: no committee
// passwords, no sessions, no archives. Every committee's next sign-in
// becomes a first sign-in again — set a password, build the roster, roll
// call.
//
//   node scripts/munWipe.js                        everything, every committee
//   node scripts/munWipe.js --keep-archives         keep previous days' minutes
//   node scripts/munWipe.js --only=unsc,hcc         just those committees
//   node scripts/munWipe.js --only=hcc --sessions-only
//                                                    clear a committee's session
//                                                    (forces roster setup to
//                                                    rerun) without touching
//                                                    its password — use this
//                                                    when you've changed a
//                                                    committee's roster in
//                                                    munData.js after it
//                                                    already signed in once,
//                                                    since the stored session
//                                                    is what "Reset session"
//                                                    in Settings reuses, not
//                                                    munData.js.
//
// One thing this script cannot do: sign anyone out. requireCommitteeAuth
// verifies the JWT and never touches the database, so a browser holding an
// 18-hour cookie will sail straight past a cleared password and land on
// whatever screen the (now missing) session implies — which, after a
// --sessions-only wipe, is exactly the roster-setup screen you want. If you
// wipe access too (the default, full wipe), change JWT_SECRET in your .env
// and restart to invalidate every outstanding cookie at once; that only
// matters when you're relying on the password actually being gone.
// ---------------------------------------------------------------------------

import "dotenv/config";
import mongoose from "mongoose";
import CommitteeAccess from "../models/CommitteeAccess.js";
import CommitteeSession from "../models/CommitteeSession.js";
import CommitteeSessionArchive from "../models/CommitteeSessionArchive.js";
import { COMMITTEE_IDS, isKnownCommittee } from "../config/munCommittees.js";

const uri =
  process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!uri) {
  console.error(
    "No connection string. Set MONGO_URI (or MONGODB_URI) in your .env.",
  );
  process.exit(1);
}

const keepArchives = process.argv.includes("--keep-archives");
const sessionsOnly = process.argv.includes("--sessions-only");

const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg
  ? onlyArg
      .slice("--only=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

if (only) {
  const unknown = only.filter((id) => !isKnownCommittee(id));
  if (unknown.length) {
    console.error(
      `Unknown committee: ${unknown.join(", ")}. Known ids: ${COMMITTEE_IDS.join(", ")}`,
    );
    process.exit(1);
  }
}

const filter = only ? { committeeId: { $in: only } } : {};
const scope = only ? only.join(", ") : "all committees";

await mongoose.connect(uri);

const [access, sessions, archives] = await Promise.all([
  sessionsOnly
    ? Promise.resolve({ deletedCount: 0 })
    : CommitteeAccess.deleteMany(filter),
  CommitteeSession.deleteMany(filter),
  keepArchives
    ? Promise.resolve({ deletedCount: 0 })
    : CommitteeSessionArchive.deleteMany(filter),
]);

console.log(`Wiped ${scope}:`);
console.log(
  `  passwords  ${access.deletedCount}${sessionsOnly ? " (skipped — --sessions-only)" : ""}`,
);
console.log(`  sessions   ${sessions.deletedCount}`);
console.log(
  `  archives   ${archives.deletedCount}${keepArchives ? " (kept)" : ""}`,
);

if (sessionsOnly) {
  console.log(
    "\nPassword untouched. If your browser is still signed in to a wiped " +
      "committee, just reload /command — no need to sign in again — and " +
      "you'll land on that committee's roster-setup screen.",
  );
} else {
  console.log(
    "\nNow change JWT_SECRET and restart, or old cookies still work.",
  );
}

await mongoose.disconnect();
