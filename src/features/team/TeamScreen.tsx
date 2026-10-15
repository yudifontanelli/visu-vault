import { PageScroll } from '../../design/Page';
import { SectionHeader } from '../../design/SectionHeader';
import { sectionById } from '../sections';

export function TeamScreen() {
  const s = sectionById('team');
  return (
    <PageScroll>
      <SectionHeader number={s.number} name={s.name} title={s.kicker} />
    </PageScroll>
  );
}
