import styles from "./layout.module.css";

/** Frame of the sign-in screens: content centered on the page. */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className={styles.page}>{children}</main>;
}
