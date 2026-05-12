import MarketingNav from "@/components/MarketingNav";
import Footer from "@/components/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
