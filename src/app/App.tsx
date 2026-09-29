import { DeskCanvas } from '../scene/Canvas';
import { SkipIntro } from '../ui/SkipIntro';
import { Reader, ReaderSync } from '../reader/Reader';
import { ObjectTags } from '../ui/ObjectTag';
import { ContactOverlay, SpillSync } from '../ui/ContactOverlay';
import { ViewSync } from './viewStore';
import { ReportCardView } from '../reader/ReportCardView';
import { useRoute } from './routes';

export function App() {
  const onDesk = useRoute((s) => s.route.view === 'desk');
  return (
    <>
      <DeskCanvas />
      <ObjectTags enabled={onDesk} />
      <ReaderSync />
      <SpillSync />
      <ViewSync />
      <ReportCardView />
      <ContactOverlay />
      <Reader />
      <SkipIntro />
    </>
  );
}
