import { DeskCanvas } from '../scene/Canvas';
import { SkipIntro } from '../ui/SkipIntro';
import { Reader, ReaderSync } from '../reader/Reader';
import { ObjectTags } from '../ui/ObjectTag';
import { useRoute } from './routes';

export function App() {
  const onDesk = useRoute((s) => s.route.view === 'desk');
  return (
    <>
      <DeskCanvas />
      <ObjectTags enabled={onDesk} />
      <ReaderSync />
      <Reader />
      <SkipIntro />
    </>
  );
}
