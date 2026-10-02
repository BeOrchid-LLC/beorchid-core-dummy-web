import type { ReactNode } from 'react';
import Link from 'next/link';
import { isClerkConfigured } from '@/lib/session';
import './globals.css';

export const metadata = {
  title: 'Core Dummy Web',
  description: 'Independent BeOrchid Core integration acceptance harness',
};

async function Providers({ children }: { children: ReactNode }) {
  if (!isClerkConfigured()) return <>{children}</>;
  const { ClerkProvider } = await import('@clerk/nextjs');
  return <ClerkProvider>{children}</ClerkProvider>;
}

async function AccountControls() {
  if (!isClerkConfigured()) return <span className="muted">fixture auth</span>;
  const { OrganizationSwitcher, SignedIn, SignedOut, SignInButton, UserButton } = await import(
    '@clerk/nextjs'
  );
  return (
    <>
      <SignedIn>
        <OrganizationSwitcher hidePersonal />
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="redirect">
          <button type="button">Sign in</button>
        </SignInButton>
      </SignedOut>
    </>
  );
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <nav className="top">
            <div className="inner">
              <strong>Core Dummy Web</strong>
              <Link href="/">Home</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/records">Records</Link>
              <Link href="/admin">Admin</Link>
              <span className="spacer" />
              <AccountControls />
            </div>
          </nav>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
