import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <main className="w-full md:pl-64 flex flex-col relative min-h-screen pt-16">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
