import Menu, { MenuDivider, MenuLabel, menuItemClass } from "@/components/ui/Menu";
import { ThemeLabel, switchTheme } from "@/components/ui/ThemeToggle";
import { FEEDBACK_URL } from "@/lib/site";

// Backups, light or dark mode, feedback and the example resume
export default function MoreMenu({
  resumeCount,
  buttonClass,
  onSaveBackup,
  onOpenBackup,
  onLoadExample,
}: {
  resumeCount: number;
  buttonClass: string;
  onSaveBackup: () => void;
  onOpenBackup: () => void;
  onLoadExample: () => void;
}) {
  return (
    <Menu
      label={
        <>
          <span className="sm:hidden" aria-label="More">
            ⋯
          </span>
          <span className="hidden sm:inline">More</span>
        </>
      }
      buttonClass={buttonClass}
    >
      <MenuLabel>Saved only in this browser</MenuLabel>
      <button type="button" className={menuItemClass} onClick={onSaveBackup}>
        Save backup file
        <span className="block text-xs font-normal text-muted">
          {resumeCount === 1 ? "Your resume" : `All ${resumeCount} resumes`}, to keep safe or move to another device
        </span>
      </button>
      <button type="button" className={menuItemClass} onClick={onOpenBackup}>
        Open backup file
      </button>
      <MenuDivider />
      <button type="button" className={menuItemClass} onClick={switchTheme}>
        <ThemeLabel />
      </button>
      <MenuDivider />
      <a href={FEEDBACK_URL} className={menuItemClass}>
        Send feedback
        <span className="block text-xs font-normal text-muted">Report a bug or suggest an idea</span>
      </a>
      <MenuDivider />
      <button type="button" className={menuItemClass} onClick={onLoadExample}>
        Load example
      </button>
    </Menu>
  );
}
