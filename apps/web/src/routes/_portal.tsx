import { createFileRoute, Outlet } from '@tanstack/react-router';
import Footer from '@/components/footer';
import Header from '@/components/header';

export const Route = createFileRoute('/_portal')({
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <div
      data-theme="portal"
      className="grid min-h-screen grid-rows-[auto_1fr_auto]"
    >
      <Header />
      <div className="flex flex-col bg-background text-foreground">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
