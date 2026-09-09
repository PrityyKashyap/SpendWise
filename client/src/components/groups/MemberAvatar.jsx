/** Deterministic colour per member, so the same person keeps the same tint. */
const TINTS = [
  ['#EEF2FF', '#4F46E5'],
  ['#ECFDF5', '#059669'],
  ['#FFF7ED', '#EA580C'],
  ['#FDF2F8', '#DB2777'],
  ['#F0F9FF', '#0284C7'],
  ['#FAF5FF', '#9333EA'],
];

function tintFor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i)) % TINTS.length;
  return TINTS[hash];
}

export default function MemberAvatar({ member, size = 'md' }) {
  const [background, color] = tintFor(member?._id ?? member?.name ?? '');
  const dimensions = size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs';

  return (
    <span
      className={`grid ${dimensions} shrink-0 place-items-center rounded-full font-semibold`}
      style={{ backgroundColor: background, color }}
      title={member?.name}
      aria-hidden="true"
    >
      {(member?.name ?? '?').charAt(0).toUpperCase()}
    </span>
  );
}
