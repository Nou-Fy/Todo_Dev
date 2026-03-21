import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Todo",
  description: "Gestion simple de tes taches",
};

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/todo", label: "Todo" },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{ cssLayerName: "clerk" }} // Applique la configuration d'apparence
    >
      <html lang="fr">
        <body className="antialiased">
          <div className="min-h-dvh bg-background text-foreground">
            <div className="flex min-h-dvh">
              <aside className="hidden w-64 shrink-0 border-r bg-card/40 md:flex md:flex-col">
                <div className="flex h-14 items-center gap-2 border-b px-4">
                  <Link href="/" className="text-sm font-semibold">
                    Todo
                  </Link>
                </div>
                <nav className="flex-1 p-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col">
                <header>
                  <div className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div>
                      <nav className="flex items-center gap-1">
                        {navItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-lg px-3 py-2 text-sm hover:bg-muted">
                            {item.label}
                          </Link>
                        ))}
                      </nav>
                    </div>

                    <div>
                      <Show when="signed-out">
                        <div className="flex items-center gap-2">
                          <SignInButton mode="modal">
                            <button className="rounded-lg px-3 py-2 text-sm hover:bg-muted">
                              Se connecter
                            </button>
                          </SignInButton>

                          <SignUpButton mode="modal">
                            <button className="transform rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm transition-transform duration-200 hover:scale-105 hover:opacity-90">
                              Inscription
                            </button>
                          </SignUpButton>
                        </div>
                      </Show>

                      <Show when="signed-in">
                        <UserButton />
                      </Show>
                    </div>
                  </div>
                </header>

                <main className="flex-1 p-4 md:p-6">{children}</main>
              </div>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
