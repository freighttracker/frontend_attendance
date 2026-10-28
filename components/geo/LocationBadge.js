import { locationLabel, locationTone } from '@/lib/utils/geolocation';

export default function LocationBadge({ validationStatus, reviewStatus, title }) {
  const tone = locationTone(validationStatus, reviewStatus);
  return (
    <span className={`gpill g-${tone}`} title={title}>
      {locationLabel(validationStatus, reviewStatus)}
    </span>
  );
}
