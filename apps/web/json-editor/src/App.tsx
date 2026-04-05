import { Menu } from 'lucide-react';
import styles from './App.module.css';
import PreviewPanel from './components/PreviewPanel/PreviewPanel.tsx';
import SectionEditor from './components/SectionEditor/SectionEditor.tsx';
import Sidebar from './components/Sidebar/Sidebar.tsx';
import { SkeletonEditor } from './components/Skeleton/Skeleton.tsx';
import TopBar from './components/TopBar/TopBar.tsx';
import UploadZone from './components/UploadZone/UploadZone.tsx';
import { EditorProvider, useEditor } from './context/EditorContext.tsx';
import { cn } from './lib/cn.ts';
import { l } from './locales/index.ts';

function EditorApp() {
  const { state, dispatch, sidebarCollapsed, sidebarWidth, view } = useEditor();

  if (state.isLoading) {
    return <SkeletonEditor />;
  }

  if (view === 'upload') {
    return <UploadZone />;
  }

  return (
    <>
      <TopBar
        menuButton={
          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            title={l('sidebar.collapse')}
          >
            <Menu size={20} />
          </button>
        }
      />
      <div className={styles.layout}>
        <Sidebar />
        <main
          className={cn(styles.content, state.showPreview && styles.contentWithPreview)}
          style={{ '--sidebar-width': `${sidebarCollapsed ? 40 : sidebarWidth}px` } as React.CSSProperties}
        >
          <SectionEditor />
        </main>
      </div>
      <PreviewPanel />
    </>
  );
}

export default function App() {
  return (
    <EditorProvider>
      <EditorApp />
    </EditorProvider>
  );
}
