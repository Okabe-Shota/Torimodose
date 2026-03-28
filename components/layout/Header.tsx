import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="text-lg font-bold tracking-wider">
          TORIMODOSE
        </Link>
        <nav className="ml-auto flex gap-4 text-sm">
          <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
            ログイン
          </Link>
        </nav>
      </div>
    </header>
  );
}
