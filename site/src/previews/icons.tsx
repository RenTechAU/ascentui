// Small stroke icons for the previews. 24px grid, drawn at the size the component sets.
const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
export const Plus = () => <I d="M12 5v14M5 12h14" />;
export const Trash = () => <I d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />;
export const Arrow = () => <I d="M5 12h14M13 6l6 6-6 6" />;
export const Copy = () => <I d="M9 9h10v10H9zM5 15V5h10" />;
export const Pencil = () => <I d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />;
export const More = () => <I d="M5 12h.01M12 12h.01M19 12h.01" />;
export const Inbox = () => <I d="M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6z" />;
export const Search = () => <I d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />;
export const Mail = () => <I d="M4 6h16v12H4zM4 7l8 6 8-6" />;
export const Scale = () => <I d="M6 20h12M12 4v16M5 8h14M5 8l-2 6a3 3 0 0 0 4 0zM19 8l-2 6a3 3 0 0 0 4 0z" />;
