import Menu, { MenuDivider, MenuLabel, menuItemClass } from "@/components/ui/Menu";
import Sparkle from "@/components/ui/Sparkle";
import type { Library } from "@/lib/library";

// The open resume's name at the top left; opens the list of resumes and what to do with them
export default function ResumeMenu({
  library,
  activeName,
  onSwitch,
  onNew,
  onDuplicate,
  onImport,
  onChat,
  onRename,
  onClear,
  onDelete,
}: {
  library: Library;
  activeName: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onDuplicate: () => void;
  onImport: () => void;
  onChat: () => void;
  onRename: () => void;
  onClear: () => void;
  onDelete: () => void;
}) {
  return (
    <Menu
      align="left"
      panelClass="w-72"
      className="min-w-0"
      buttonClass="flex max-w-full items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-surface-hover sm:max-w-[14rem]"
      label={
        <>
          <span className="min-w-0 truncate">{activeName}</span>
          <span className="text-xs text-muted">▾</span>
        </>
      }
    >
      <MenuLabel>Your resumes</MenuLabel>
      {library.items.map((item) => (
        <button key={item.id} type="button" className={menuItemClass} onClick={() => onSwitch(item.id)}>
          <span className="flex items-center justify-between gap-2">
            <span className="truncate">{item.name}</span>
            {item.id === library.activeId && <span className="text-accent-ink">✓</span>}
          </span>
        </button>
      ))}
      <MenuDivider />
      <button type="button" className={menuItemClass} onClick={onNew}>
        + New blank resume
      </button>
      <button type="button" className={menuItemClass} onClick={onDuplicate}>
        Duplicate this resume
        <span className="block text-xs font-normal text-muted">To tailor a copy for another job</span>
      </button>
      <button type="button" className={menuItemClass} onClick={onImport}>
        Import an existing resume…
      </button>
      <button type="button" className={menuItemClass} onClick={onChat}>
        <span className="flex items-center gap-2">
          <Sparkle className="text-accent-ink" />
          Build with AI…
        </span>
      </button>
      <MenuDivider />
      <button type="button" className={menuItemClass} onClick={onRename}>
        Rename
      </button>
      <button type="button" className={`${menuItemClass} hover:text-danger`} onClick={onClear}>
        Clear this resume
      </button>
      {library.items.length > 1 && (
        <button type="button" className={`${menuItemClass} hover:text-danger`} onClick={onDelete}>
          Delete this resume
        </button>
      )}
    </Menu>
  );
}
