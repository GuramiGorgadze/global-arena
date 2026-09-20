import { useEffect, useState } from 'react';
import clsx from 'clsx';
import Flag from './Flag';

// A seat's face. Crisis cabinets seat people rather than countries, so a
// portrait says far more than a flag would — but every other committee has
// no portraits at all, and a portrait that 404s shouldn't leave a hole. So:
// photo if there is one and it loads, flag otherwise, same call site either
// way.
//
// `seat` is a delegate (or a roster-setup entry): { code, name, photo }.
export default function SeatAvatar({ seat, size = 24, className }) {
  const photo = seat?.photo || '';
  const [broken, setBroken] = useState(false);

  // Swapping a seat's portrait (or reusing this component for a different
  // seat at the same position in a list) has to clear a previous failure,
  // or the new photo never gets a chance to load.
  useEffect(() => {
    setBroken(false);
  }, [photo]);

  if (!photo || broken) {
    return (
      <Flag
        code={seat?.code}
        size={size}
        className={className}
      />
    );
  }

  return (
    <img
      src={photo}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className={clsx('seatPhoto', className)}
      style={{ width: size, height: size }}
    />
  );
}