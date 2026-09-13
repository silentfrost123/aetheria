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
    check: (
      <path d="M4.5 12.5l5 5L19.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    alert: (
      <>
        <path d="M12 3.5 22 20H2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        <path d="M12 10v4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="17.2" r="1.1" fill="currentColor" />
      </>
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
    search: (
      <>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    fire: (
      <path d="M12 3c1 3-1 4.5-2.5 6S7 12.5 7 15a5 5 0 0 0 10 0c0-2-1-3.5-2-5-1 1.5-1.5 2-2 2 0-3 1-6-1-9z" fill="currentColor" />
    ),
    filter: (
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    ),
    chevronDown: (
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    chevronLeft: (
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    chevronRight: (
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M16 5.5a3 3 0 0 1 0 5.5M21 20c0-2.8-1.9-5.1-4.5-5.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      </>
    ),
    tag: (
      <>
        <path d="M3 3h8l10 10-8 8L3 11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    book: (
      <>
        <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        <path d="M4 19V5M19 3v16" stroke="currentColor" strokeWidth="1.8" fill="none" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" stroke="currentColor" strokeWidth="1.6" fill="none" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        <path d="m3 13 9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
      </>
    ),
    plus: (
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ),
    sparkle: (
      <path d="M12 2c.6 3.8 1.9 5.4 6 6-4.1.6-5.4 2.2-6 6-.6-3.8-1.9-5.4-6-6 4.1-.6 5.4-2.2 6-6zM19 14c.3 1.9 1 2.7 3 3-2 .3-2.7 1.1-3 3-.3-1.9-1-2.7-3-3 2-.3 2.7-1.1 3-3z" fill="currentColor" />
    ),
    external: (
      <>
        <path d="M14 4h6v6M20 4 10 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </>
    ),
    thumbUp: (
      <>
        <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        <path d="M7 11l4-7c1 0 2 .8 2 2v3h5a2 2 0 0 1 2 2.2l-1 6A2 2 0 0 1 17 19h-9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      </>
    ),
    coins: (
      <>
        <circle cx="8" cy="12" r="6" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M15.5 7.5A6 6 0 1 1 15.5 16.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M14 8.5v3.5h3.5M18 15.5v3h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name] || paths.spark}
    </svg>
  );
}
