import type { ReactNode } from 'react';
import styles from '../eratorriak.module.css';

/** Optional 3D is a sibling of the 2D, above the information panel. No empty placeholder. */
export function TimelineLayout({
  diagram,
  children,
  view3d,
  tools3d,
  show3d = true,
}: {
  diagram: ReactNode;
  children: ReactNode;
  view3d?: ReactNode;
  tools3d?: ReactNode;
  show3d?: boolean;
}) {
  return (
    <div className={`${styles.timeline}${view3d && show3d ? '' : ` ${styles.timelineSolo}`}`}>
      {diagram}
      <div className={styles.side}>
        {view3d && show3d && (
          <div className={styles.side3d}>
            {view3d}
            {tools3d}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
