import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Navbar from '@/components/ui/Navbar';

export default function Layout({ children, meta: pageMeta }) {
  const Toaster = dynamic(() =>
    import("react-hot-toast").then((module) => module.Toaster)
  );
  const Footer = dynamic(() => import('@/components/ui/Footer'));
  const AdminMobileNav = dynamic(() => import('@/components/ui/AdminNavbar/AdminMobileNav'));
  const AdminDesktopNav = dynamic(() => import('@/components/ui/AdminNavbar/AdminDesktopNav'));
  const SimpleNav = dynamic(() => import('@/components/ui/SimpleNav'));
  const router = useRouter();
  const meta = {
    title: 'Reflio: Create a referral program without breaking the bank.',
    description: 'Create a referral program without breaking the bank.',
    cardImage: '/og.png',
    ...pageMeta
  };

  return (
    <>
      <>
        <Toaster
          position="bottom-center"
          reverseOrder={true}
          gutter={20}
          toastOptions={{
            className: '',
            duration: 5000,
            style: {
              background: '#fff',
              color: '#111827',
            },
            // Default options for specific types
            success: {
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
            error: {
              style: {
                background: '#DC2626',
                color: 'white',
              },
            },
          }}
        />
        {
          router.pathname.indexOf('/dashboard') === -1 && router.pathname.indexOf('/dashboard/add-company') === -1 &&
          <Navbar />
        }
        { 
          router.pathname === '/dashboard/add-company' &&
          <SimpleNav/>
        }
        {
          router.pathname.indexOf('/dashboard') === -1 ?
            <main id="skip">{children}</main>
          : router.pathname === '/dashboard/add-company' ?
            <main id="skip">{children}</main>
          :
            <div className="h-screen flex overflow-hidden">
              <AdminDesktopNav/>
              <div className="flex-1 overflow-auto focus:outline-none">
                <AdminMobileNav/>
                <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
                  <>
                    {children}
                  </>
                </main>
              </div>
            </div>
        }
        {
          router.pathname.indexOf('/dashboard') === -1 && router.pathname.indexOf('/dashboard/add-company') === -1 &&
          <Footer />
        }
      </>
    </>
  );
}
