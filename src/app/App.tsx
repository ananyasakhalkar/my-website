import { DeskCanvas } from '../scene/Canvas';
import { SkipIntro } from '../ui/SkipIntro';
import { Reader, ReaderSync } from '../reader/Reader';
import { ObjectTags } from '../ui/ObjectTag';
import { ContactOverlay, SpillSync } from '../ui/ContactOverlay';
import { ViewSync } from './viewStore';
import { ReportCardView } from '../reader/ReportCardView';
import { BadgeBackView } from '../reader/BadgeBackView';
import { NotebookView } from '../reader/NotebookView';
import { BoardView } from '../reader/BoardView';
import { Hud } from '../ui/Hud';
import { Hint, Loader, SlowToast } from '../ui/Loader';
import { useFocusTrap } from './a11y';
import { useRoute } from './routes';

export function App() {
  const onDesk = useRoute((s) => s.route.view === 'desk');
  useFocusTrap();
  return (
    <>
      <Hud />
      <DeskCanvas />
      <ObjectTags enabled={onDesk} />
      <ReaderSync />
      <SpillSync />
      <ViewSync />
      <ReportCardView />
      <BadgeBackView />
      <NotebookView />
      <BoardView />
      <ContactOverlay />
      <Reader />
      <SkipIntro />
      <Hint />
      <SlowToast />
      <Loader />
    </>
  );
}
