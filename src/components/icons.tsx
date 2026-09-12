// Lightweight inline SVG icons (no external dependencies)

export function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M5 9.5V21h14V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    discover: (
      <>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    characters: (
      <>
        <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M18.5 20c0-2.4 1.6-4.5 3.5-5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </>
    ),
    story: (
      <>
        <path d="M4 4h6a2 2 0 0 1 2 2v14a1.5 1.5 0 0 0-1.5-1.5H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        <path d="M20 4h-6a2 2 0 0 0-2 2v14a1.5 1.5 0 0 1 1.5-1.5H20z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      </>
    ),
    world: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M4 12h16M12 4c2.5 2.4 3.8 5 3.8 8s-1.3 5.6-3.8 8c-2.5-2.4-3.8-5-3.8-8S9.5 6.4 12 4z" stroke="currentColor" strokeWidth="1.6" fill="none" />
      </>
    ),
    create: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    chat: (
      <>
        <path d="M4 5h16v11H8l-4 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      </>
    ),
    library: (
      <>
        <path d="M4 5h4v14H4zM9 5h4v14H9zM14 5h4v14h-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      </>
    ),
    following: (
      <>
        <path d="M4 20v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" fill="none" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M10.3 21a2 2 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    spark: (
      <>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" />
        <path d="M19 16l.9 2.6L22.5 19l-2.6.9L19 22.5l-.9-2.6L15.5 19l2.6-.9z" fill="currentColor" />
      </>
    ),
    back: (
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    send: (
      <path d="M3 12l18-8-7 18-2.5-7.5L3 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 1 0-2.3 5.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M20 4v7h-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      </>
    ),
    branch: (
      <>
        <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <circle cx="18" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M6 8.5v7M8.5 6h7a2.5 2.5 0 0 1 0 5h-7" stroke="currentColor" strokeWidth="1.6" fill="none" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    heart: (
      <path d="M12 20s-7-4.5-9-9c-1.3-3 1-6 4-6 2 0 3.5 1 5 2.5C13.5 6 15 5 17 5c3 0 5.3 3 4 6-2 4.5-9 9-9 9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    ),
    heartFilled: (
      <path d="M12 20s-7-4.5-9-9c-1.3-3 1-6 4-6 2 0 3.5 1 5 2.5C13.5 6 15 5 17 5c3 0 5.3 3 4 6-2 4.5-9 9-9 9z" fill="currentColor" />
    ),
    play: (
      <path d="M7 4l12 8-12 8z" fill="currentColor" />
    ),
    dice: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <circle cx="8" cy="8" r="1.4" fill="currentColor" />
        <circle cx="16" cy="16" r="1.4" fill="currentColor" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      </>
    ),
    pin: (
      <path d="M9 4h6l-1 7 3 3H7l3-3zM12 4v17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    ),
    edit: (
      <>
        <path d="M4 20h4L19 9l-4-4L4 16z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        <path d="M13 6l4 4" stroke="currentColor" strokeWidth="1.8" fill="none" />
      </>
    ),
    close: (
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ),
    menu: (
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ),
    arrowRight: (
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      </>
    ),
    cube: (
      <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9zM12 2v9m0 0l8-4.5M12 11L4 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="m15 9-2 5-5 2 2-5z" fill="currentColor" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name] || paths.spark}
    </svg>
  );
}
