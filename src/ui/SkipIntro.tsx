import { useDesk } from '../app/store';

/** Small "skip intro" control, shown only while the intro camera move runs. */
export function SkipIntro() {
  const { introDone, skipRequested, skipIntro } = useDesk();
  if (introDone || skipRequested) return null;
  return (
    <button type="button" className="skip-intro" onClick={skipIntro}>
      skip intro
    </button>
  );
}
