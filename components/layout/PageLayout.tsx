import Header from "./Header";
import Footer from "./Footer";

interface PageLayoutProps {
  children: React.ReactNode;
  user?: {
    fname: string;
    lname: string;
    email: string;
  } | null;
}

export default function PageLayout({ children, user }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

