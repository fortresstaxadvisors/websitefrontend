"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  serviceClusters,
  industryLinks,
  primaryNav,
  utilityNav,
} from "@/lib/nav";
import { KeystoneGlyph } from "@/components/brand/motifs";

/*
  Mega-menu header — Slate & Brass.
   - Utility bar (Search, Client Portal) above the main bar
   - Primary nav with mega-menus for Services (3 clusters) and Industries
   - Transparent over hero, solid (blurred ivory) on scroll
   - Accessible: aria-expanded / aria-controls, Escape to close, hover + focus
   - Designed mobile nav (not a shrunk desktop nav) with accordion disclosure

  Keyboard model (WCAG 2.1.1 / 2.4.3 / 4.1.2):
   - Each cluster's mega-panel is rendered INSIDE that cluster's wrapper, so
     DOM/tab order flows trigger -> panel links -> next nav item. A keyboard
     user therefore Tabs straight into the open panel with no roving-focus
     trickery. The panel still spans full width because it anchors to the
     sticky <header>, not to the (static) wrapper.
   - A closed panel / drawer / accordion is `inert` + visibility:hidden, so its
     controls stay OUT of the tab order and the a11y tree while the
     max-height/opacity transition is preserved.
   - Escape closes the open overlay and returns focus to the control that owns
     it (the trigger, or the mobile toggle).
*/

type MenuId = "services" | "industries" | null;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // mobile drawer
  const [menu, setMenu] = useState<MenuId>(null); // desktop mega-menu
  const [mobilePanel, setMobilePanel] = useState<MenuId>(null);
  const [prevPath, setPrevPath] = useState(pathname);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  // Refs to the mega-menu triggers and the mobile toggle, so Escape can return
  // focus to the control that owns the overlay it just closed.
  const triggerRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const toggleRef = useRef<HTMLButtonElement>(null);
  // When Escape closes a panel we return focus to its trigger; this flag stops
  // that programmatic focus from immediately re-opening the panel via onFocus.
  const suppressOpenOnFocus = useRef(false);
  // Mirror of `open` so the deps-free global Escape listener reads the live
  // value without re-subscribing on every toggle. Synced in an effect (the ref
  // must not be written during render).
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Reset transient menu state when the route changes — the documented React
  // "adjusting state on a prop change" pattern (storing the previous value in
  // state), not an effect and not a ref read during render.
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenu(null);
    setOpen(false);
    setMobilePanel(null);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes any open menu/drawer; click-away closes the mega-menu.
  // When Escape closes the mobile drawer, focus returns to its toggle button.
  // (Desktop mega-menu focus-return is handled per-cluster in onKeyDown below,
  // where the open menu id is in scope.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        if (openRef.current) {
          setOpen(false);
          toggleRef.current?.focus();
        }
      }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const openMenu = (id: MenuId) => {
    window.clearTimeout(closeTimer.current);
    setMenu(id);
  };
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenu(null), 140);
  };

  const solid = scrolled || menu !== null;

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 transition-[background,box-shadow,border-color] duration-300"
      style={{
        background: solid ? "rgba(243, 238, 228, 0.86)" : "transparent",
        backdropFilter: solid ? "saturate(140%) blur(12px)" : "none",
        WebkitBackdropFilter: solid ? "saturate(140%) blur(12px)" : "none",
        borderBottom: solid
          ? "1px solid var(--line-soft)"
          : "1px solid transparent",
      }}
      onMouseLeave={scheduleClose}
    >
      {/* Utility bar */}
      <div className="hidden border-b border-[var(--line-soft)] md:block">
        <div className="shell flex items-center justify-end gap-6 py-1.5 text-[0.72rem] font-medium tracking-[0.02em] text-[var(--faint)]">
          <span className="mr-auto inline-flex items-center gap-2 text-[var(--accent-ink)]">
            <KeystoneGlyph className="h-3 w-3" />
            Built to Hold.
          </span>
          {utilityNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-[var(--ink)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main bar */}
      <div className="shell flex items-center justify-between py-3.5 md:py-4">
        <Link
          href="/"
          className="flex items-center gap-3.5"
          aria-label="Fortress Tax Advisors — home"
        >
          <Image
            src="/fortress-mark.svg"
            alt=""
            width={42}
            height={42}
            className="h-10 w-10"
            priority
          />
          <span className="leading-none">
            <span className="serif block text-[1.3rem] font-semibold tracking-[0.06em] text-[var(--slate)] md:text-[1.42rem]">
              FORTRESS
            </span>
            <span className="mt-1 block text-[0.64rem] font-semibold uppercase tracking-[0.36em] text-[var(--muted)]">
              Tax Advisors
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {primaryNav.map((item) => {
            const hasMenu =
              item.label === "Services" || item.label === "Industries";
            const id: MenuId =
              item.label === "Services"
                ? "services"
                : item.label === "Industries"
                ? "industries"
                : null;
            const panelOpen = hasMenu && menu === id;
            const underlineVisible =
              isActive(item.href) || (hasMenu && menu === id);
            return (
              <div
                key={item.href}
                /* Intentionally NOT `relative`: the mega-panel below is a child
                   of this wrapper (so DOM/tab order is trigger -> panel links ->
                   next item), but it must anchor to the sticky <header> for its
                   full-bleed width — so this wrapper stays a static containing
                   block. The trigger keeps its own `relative` for the underline.
                   `contents` on mobile keeps layout identical to before. */
                className="contents md:block"
                onMouseEnter={() => hasMenu && openMenu(id)}
                onMouseLeave={() => hasMenu && scheduleClose()}
                /* Keep the panel open while focus is anywhere inside this
                   cluster; close once focus leaves it entirely (Tab past the
                   last panel link, or Shift+Tab before the trigger). */
                onBlur={(e) => {
                  if (
                    hasMenu &&
                    !e.currentTarget.contains(e.relatedTarget as Node | null)
                  ) {
                    scheduleClose();
                  }
                }}
                /* Escape closes this cluster and returns focus to its trigger
                   (the open id is in scope here, unlike the global listener). */
                onKeyDown={(e) => {
                  if (hasMenu && id && e.key === "Escape" && menu === id) {
                    e.stopPropagation();
                    setMenu(null);
                    // Returning focus to the trigger fires its onFocus, which
                    // would re-open the panel — suppress that one re-open.
                    suppressOpenOnFocus.current = true;
                    triggerRefs.current[id]?.focus();
                  }
                }}
              >
                <Link
                  ref={
                    hasMenu && id
                      ? (el) => {
                          triggerRefs.current[id] = el;
                        }
                      : undefined
                  }
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  aria-expanded={hasMenu ? menu === id : undefined}
                  aria-haspopup={hasMenu ? "true" : undefined}
                  aria-controls={hasMenu && id ? `mega-${id}` : undefined}
                  onFocus={() => {
                    if (suppressOpenOnFocus.current) {
                      suppressOpenOnFocus.current = false;
                      return;
                    }
                    if (hasMenu) openMenu(id);
                  }}
                  className="group relative inline-flex items-center gap-1.5 py-1 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                >
                  {item.label}
                  {hasMenu ? (
                    <span
                      className="text-[var(--faint)] transition-transform duration-300"
                      style={{
                        transform:
                          menu === id ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Chevron />
                    </span>
                  ) : null}
                  <span
                    className={`absolute -bottom-1 left-0 h-px w-full origin-left bg-[var(--accent)] transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 ${
                      underlineVisible ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>

                {/* ---- Desktop mega-menu panel (Services) ----
                   Rendered inside the cluster wrapper, so its links sit
                   immediately after the trigger in DOM/tab order; anchored to
                   the sticky <header> for full-bleed width. `inert` +
                   visibility:hidden while closed keeps the links out of the tab
                   order and a11y tree; the transition is preserved. */}
                {hasMenu && id === "services" ? (
                  <div
                    id="mega-services"
                    inert={!panelOpen ? true : undefined}
                    className="absolute inset-x-0 top-full hidden overflow-hidden border-b border-[var(--line)] bg-[rgba(243,238,228,0.97)] shadow-[0_30px_60px_-40px_rgba(12,17,22,0.5)] backdrop-blur-md transition-[max-height,opacity] duration-300 md:block"
                    style={{
                      maxHeight: panelOpen ? "30rem" : "0rem",
                      opacity: panelOpen ? 1 : 0,
                      visibility: panelOpen ? "visible" : "hidden",
                      pointerEvents: panelOpen ? "auto" : "none",
                    }}
                  >
                    <div className="shell grid grid-cols-3 gap-10 py-9">
                      {serviceClusters.map((cluster) => (
                        <div key={cluster.id}>
                          <p className="eyebrow eyebrow--bare !text-[var(--accent-ink)]">
                            {cluster.title}
                          </p>
                          <p className="mt-2 text-[0.78rem] leading-5 text-[var(--faint)]">
                            {cluster.summary}
                          </p>
                          <ul className="mt-5 space-y-4">
                            {cluster.links.map((link) => (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  className="group block"
                                  aria-current={
                                    isActive(link.href) ? "page" : undefined
                                  }
                                >
                                  <span className="serif block text-[1.05rem] text-[var(--ink)] transition-colors group-hover:text-[var(--accent-ink)]">
                                    {link.label}
                                  </span>
                                  {link.blurb ? (
                                    <span className="mt-0.5 block text-[0.8rem] leading-5 text-[var(--muted)]">
                                      {link.blurb}
                                    </span>
                                  ) : null}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* ---- Desktop mega-menu panel (Industries) ---- */}
                {hasMenu && id === "industries" ? (
                  <div
                    id="mega-industries"
                    inert={!panelOpen ? true : undefined}
                    className="absolute inset-x-0 top-full hidden overflow-hidden border-b border-[var(--line)] bg-[rgba(243,238,228,0.97)] shadow-[0_30px_60px_-40px_rgba(12,17,22,0.5)] backdrop-blur-md transition-[max-height,opacity] duration-300 md:block"
                    style={{
                      maxHeight: panelOpen ? "30rem" : "0rem",
                      opacity: panelOpen ? 1 : 0,
                      visibility: panelOpen ? "visible" : "hidden",
                      pointerEvents: panelOpen ? "auto" : "none",
                    }}
                  >
                    <div className="shell grid grid-cols-[1fr_1.6fr] gap-12 py-9">
                      <div className="max-w-xs">
                        <p className="eyebrow eyebrow--bare !text-[var(--accent-ink)]">
                          Industries
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                          Sector-aware work where ownership complexity, operating
                          reality, and reporting exposure change the planning
                          answer.
                        </p>
                        <Link href="/industries" className="link-arrow mt-5">
                          All industries
                          <span className="arrow" aria-hidden="true">
                            &rarr;
                          </span>
                        </Link>
                      </div>
                      <ul className="grid grid-cols-2 gap-x-10 gap-y-1 self-center">
                        {industryLinks.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="group flex items-center justify-between gap-4 border-b border-[var(--line-soft)] py-3"
                              aria-current={
                                isActive(link.href) ? "page" : undefined
                              }
                            >
                              <span className="serif text-[1.02rem] text-[var(--ink)] transition-colors group-hover:text-[var(--accent-ink)]">
                                {link.label}
                              </span>
                              <span
                                className="text-[var(--accent-ink)] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                                aria-hidden="true"
                              >
                                &rarr;
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
          <Link
            href="/contact"
            className="btn btn-primary !px-5 !py-2.5"
          >
            Schedule a Consultation
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          ref={toggleRef}
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className="absolute left-0 block h-0.5 w-5 bg-[var(--ink)] transition-all duration-300"
              style={{ top: open ? "6px" : "0px", transform: open ? "rotate(45deg)" : "none" }}
            />
            <span
              className="absolute left-0 top-1.5 block h-0.5 w-5 bg-[var(--ink)] transition-opacity duration-200"
              style={{ opacity: open ? 0 : 1 }}
            />
            <span
              className="absolute left-0 block h-0.5 w-5 bg-[var(--ink)] transition-all duration-300"
              style={{ bottom: open ? "6px" : "0px", transform: open ? "rotate(-45deg)" : "none" }}
            />
          </span>
        </button>
      </div>

      {/* ---- Mobile drawer ----
         When closed, the drawer is `inert` + visibility:hidden so its links and
         accordion buttons stay OUT of the tab order and the a11y tree (a
         max-height:0 / opacity:0 container alone still leaves them focusable,
         clipped off-screen). The transition is preserved. */}
      <div
        id="mobile-nav"
        inert={!open ? true : undefined}
        className="overflow-y-auto border-t border-[var(--line-soft)] bg-[rgba(243,238,228,0.98)] backdrop-blur-md transition-[max-height,opacity,visibility] duration-400 md:hidden"
        style={{
          maxHeight: open ? "calc(100dvh - 4rem)" : "0",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
        }}
      >
        <nav aria-label="Mobile" className="shell flex flex-col py-3">
          <MobileAccordion
            label="Services"
            open={mobilePanel === "services"}
            onToggle={() =>
              setMobilePanel((p) => (p === "services" ? null : "services"))
            }
          >
            {serviceClusters.map((cluster) => (
              <div key={cluster.id} className="mt-3 first:mt-1">
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)]">
                  {cluster.title}
                </p>
                <ul className="mt-2 space-y-2">
                  {cluster.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="block py-1 text-[1.05rem] text-[var(--ink)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </MobileAccordion>

          <MobileAccordion
            label="Industries"
            open={mobilePanel === "industries"}
            onToggle={() =>
              setMobilePanel((p) => (p === "industries" ? null : "industries"))
            }
          >
            <ul className="space-y-2 pt-1">
              {industryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-1 text-[1.05rem] text-[var(--ink)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </MobileAccordion>

          <Link
            href="/insights"
            onClick={() => setOpen(false)}
            aria-current={isActive("/insights") ? "page" : undefined}
            className="flex items-baseline gap-4 border-b border-[var(--line-soft)] py-4"
          >
            <span className="serif text-[1.45rem] text-[var(--ink)]">
              Insights
            </span>
          </Link>

          <div className="grid grid-cols-2 gap-3 border-b border-[var(--line-soft)] py-4">
            {utilityNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-[var(--muted)]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="btn btn-primary mt-5 mb-4 w-full"
          >
            Schedule a Consultation
          </Link>
        </nav>
      </div>
    </header>
  );
}

function MobileAccordion({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const panelId = `m-${label.toLowerCase()}`;
  return (
    <div className="border-b border-[var(--line-soft)]">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="serif text-[1.45rem] text-[var(--ink)]">{label}</span>
        <span
          className="text-[var(--accent-ink)] transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
          aria-hidden="true"
        >
          <Chevron />
        </span>
      </button>
      <div
        id={panelId}
        inert={!open ? true : undefined}
        className="overflow-hidden transition-[max-height,opacity,visibility] duration-300"
        style={{
          maxHeight: open ? "32rem" : "0",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
        }}
      >
        <div className="pb-4">{children}</div>
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
