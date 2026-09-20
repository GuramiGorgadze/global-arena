import { useEffect, useState } from 'react';
import { flagEmoji, flagSrcSet, flagUrl } from '../../data/munData';

// Flags load from flagcdn.com. If the venue Wi-Fi drops (it will) the image
// fails and we swap to the Unicode emoji flag built from the same ISO code,
// so a placard never renders as a blank box in front of a room.
export default function Flag({ code, size = 28, title = '', className = '' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [code]);

  const style = { width: size, height: Math.round((size * 3) / 4) };
  const classes = ['munFlag', className].filter(Boolean).join(' ');

  if (!code) {
    return (
      <span
        className={`${classes} munFlag--empty`}
        style={style}
        aria-hidden="true"
      />
    );
  }

  if (failed) {
    return (
      <span
        className={`${classes} munFlag--emoji`}
        style={{ ...style, fontSize: Math.round(size * 0.86) }}
        title={title}
        role={title ? 'img' : undefined}
        aria-label={title || undefined}
        aria-hidden={title ? undefined : 'true'}
      >
        {flagEmoji(code)}
      </span>
    );
  }

  return (
    <img
      className={classes}
      style={style}
      src={flagUrl(code, size > 40 ? 80 : 40)}
      srcSet={flagSrcSet(code, size > 40 ? 80 : 40)}
      width={style.width}
      height={style.height}
      alt={title || ''}
      title={title}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}