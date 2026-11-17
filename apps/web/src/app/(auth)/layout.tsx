import Link from "next/link";
import { AppBackground } from "@/components/ui/AppBackground";
import { Icon } from "@/components/ui/Icon";
import { LINKS } from "@/lib/links";
import styles from "./layout.module.css";

/**
 * Frame of the sign-in screens: animated background, content centered, and links to the
 * GitHub repository and the website (the landing) at the bottom right.
 */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AppBackground />
      <main className={styles.page}>{children}</main>
      <nav className={styles.footer} aria-label="Enlaces de WorkBoard">
        <a className={styles.footerLink} href={LINKS.repository} target="_blank" rel="noreferrer">
          <Icon name="code" /> GitHub
        </a>
        <Link className={styles.footerLink} href="/">
          <Icon name="globe" /> Web
        </Link>
      </nav>
    </>
  );
}
