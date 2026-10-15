import { PageScroll } from '../../design/Page';
import { SectionHeader } from '../../design/SectionHeader';
import { sectionById } from '../sections';

export function ArchiveScreen() {
  const s = sectionById('archive');
  return (
    <PageScroll>
      <SectionHeader number={s.number} name={s.name} title={s.kicker} />
    </PageScroll>
  );
}
