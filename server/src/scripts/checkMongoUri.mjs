/**
 * Test a MongoDB Atlas connection string locally, without exposing it.
 *
 * Usage:
 *   MONGO_URI='mongodb+srv://user:pass@cluster.mongodb.net/spendwise' \
 *     node scripts/check-mongo-uri.mjs
 *
 * Prints ONLY a diagnosis — never the URI, the username or the password.
 * Run this before pasting a string into Render: the feedback loop is two
 * seconds instead of a ninety-second deploy.
 */
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('  Set MONGO_URI first. Nothing was printed or stored.');
  process.exit(1);
}

/* ---- Structural checks, before we even dial out ---- */
const problems = [];

if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
  problems.push('Does not start with mongodb:// or mongodb+srv://');
}

// Split off the credentials without ever printing them.
const afterScheme = uri.replace(/^mongodb(\+srv)?:\/\//, '');
const atIndex = afterScheme.lastIndexOf('@');

if (atIndex === -1) {
  problems.push('No credentials found (expected user:password@host)');
} else {
  const creds = afterScheme.slice(0, atIndex);
  const colon = creds.indexOf(':');
  if (colon === -1) {
    problems.push('No password found (expected user:password)');
  } else {
    const password = creds.slice(colon + 1);

    // THE usual cause of "bad auth": a raw special character in the password.
    // These must be percent-encoded or the URI parses wrongly.
    const raw = [...new Set(password.match(/[@:/?#[\]%&=+ ]/g) ?? [])];
    const encoded = /%[0-9a-fA-F]{2}/.test(password);

    if (raw.length > 0 && !encoded) {
      problems.push(
        `Password contains unencoded special character(s): ${raw.map((c) => `"${c}"`).join(', ')}\n` +
        '      Percent-encode them:  @ → %40   # → %23   % → %25   / → %2F\n' +
        '      : → %3A   ? → %3F   & → %26   = → %3D   space → %20\n' +
        '      Simplest fix: set an alphanumeric password in Atlas.'
      );
    }
    if (password.length === 0) problems.push('Password is empty');
  }

  const hostAndAfter = afterScheme.slice(atIndex + 1);
  const [hostPart, rest = ''] = hostAndAfter.split(/[/?]/);
  if (!hostPart.includes('.')) problems.push('Host does not look like a valid Atlas hostname');
  if (!/^[^?]+/.test(rest)) {
    problems.push('No database name in the path — append /spendwise before the "?"');
  }
}

if (problems.length > 0) {
  console.error('\n  Structural problems found:\n');
  for (const p of problems) console.error(`    - ${p}`);
  console.error('');
}

/* ---- Live connection test ---- */
console.log('  Connecting to Atlas…');

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const { host, name } = mongoose.connection;
  console.log(`\n  ✅ CONNECTED — host ${host}, database "${name}"`);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`  Collections: ${collections.length === 0 ? '(none yet)' : collections.map((c) => c.name).join(', ')}`);
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  const message = err?.message ?? String(err);
  console.error(`\n  ❌ FAILED: ${message}\n`);

  if (/bad auth|Authentication failed/i.test(message)) {
    console.error('  This is an AUTHENTICATION rejection — not a network problem.');
    console.error('  Atlas received the request and refused the username/password.\n');
    console.error('  Check, in order:');
    console.error('    1. Password special characters are percent-encoded (see above)');
    console.error('    2. The DB user exists under THIS cluster\'s project');
    console.error('       (Atlas → Database Access — users are per-project, not per-cluster)');
    console.error('    3. The username is spelled exactly right (case-sensitive)');
    console.error('    4. The user\'s auth database is "admin" (the Atlas default)');
  } else if (/ETIMEDOUT|ENOTFOUND|querySrv|ServerSelection/i.test(message)) {
    console.error('  This looks like a NETWORK/DNS problem, not credentials.');
    console.error('  Check Atlas → Network Access allows the connecting IP.');
  }
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
