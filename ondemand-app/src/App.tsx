import { useStore } from './store/store';
import { usePanes } from './shared/panes';
import { DevBar } from './shared/DevBar';
import { WhatsAppPane } from './shared/WhatsAppPane';
import { SlackPane } from './shared/SlackPane';
import { SiteApp } from './site/SiteApp';
import { Panel } from './panel/Panel';
import { TrainerApp } from './trainer/TrainerApp';

export default function App() {
  const { state } = useStore();
  const { pane } = usePanes();

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <DevBar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {state.role === 'site' && (
          <div className="site-zoom">
            <SiteApp />
          </div>
        )}
        {state.role === 'panel' && <Panel />}
        {state.role === 'trainer' && <TrainerApp />}
      </div>
      {pane === 'whatsapp' && <WhatsAppPane />}
      {pane === 'slack' && <SlackPane />}
    </div>
  );
}
