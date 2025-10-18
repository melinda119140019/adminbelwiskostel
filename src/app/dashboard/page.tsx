/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  User,
  Settings,
  LogOut,
  FileText,
  BarChart3,
  Users,
  BedSingle,
  Package,
  Menu,
  Bell,
  AlertTriangle,
  Home,
} from "lucide-react";
import { getDashboardInfo } from "./services/service_dashboard";
import { Dashboard } from "./models";
import { authService } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastContect";
import Link from "next/link";
import clsx from "clsx";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isValid = await authService.checkSession();
      if (!isValid) {
        router.push("/login?session=expired");
        return;
      }
      const profile = await authService.fetchProfile();
      if (profile?.username) setUser(profile);
      const res = await getDashboardInfo();
      if (res) setDashboard(res);
    } catch (error) {
      showToast("error", `Gagal mengambil data: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout gagal:", error);
    }
  };

  const totalNotifikasi =
    (dashboard?.amountBooking ?? 0) + (dashboard?.amountReport ?? 0);

  return (
    <main className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-full bg-indigo-700 text-white shadow-lg transition-all duration-500 ease-in-out z-40 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Header Sidebar */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-indigo-500">
          {sidebarOpen ? (
            <h2 className="text-lg font-bold">Admin Panel</h2>
          ) : (
            <h2 className="text-lg font-bold">A</h2>
          )}
          <button
            className="p-2 rounded hover:bg-indigo-600"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav className="mt-4 flex flex-col space-y-1 px-3">
          <SidebarItem
            href="/dashboard"
            icon={<Home size={18} />}
            label="Dashboard"
            open={sidebarOpen}
          />
          <SidebarItem
            href="/customer"
            icon={<Users size={18} />}
            label="Pengguna"
            open={sidebarOpen}
          />
          <SidebarItem
            href="/room"
            icon={<BedSingle size={18} />}
            label="Kamar"
            open={sidebarOpen}
          />
          <SidebarItem
            href="/facility"
            icon={<Package size={18} />}
            label="Fasilitas"
            open={sidebarOpen}
          />
          <SidebarItem
            href="/reports"
            icon={<FileText size={18} />}
            label="Laporan"
            open={sidebarOpen}
          />
          <SidebarItem
            href="/booking"
            icon={<BarChart3 size={18} />}
            label="Booking"
            open={sidebarOpen}
          />
          <SidebarItem
            href="/settings"
            icon={<Settings size={18} />}
            label="Pengaturan"
            open={sidebarOpen}
          />

          <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center gap-3 p-3 mt-4 text-red-300 hover:text-white hover:bg-red-600 rounded-lg transition",
              !sidebarOpen && "justify-center"
            )}
            title={!sidebarOpen ? "Logout" : ""}
          >
            <LogOut size={18} /> {sidebarOpen && "Logout"}
          </button>
        </nav>
      </aside>

      {/* Konten utama */}
      <div
        className={clsx(
          "flex-1 transition-all duration-500",
          sidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        {/* Header */}
        <header className="flex justify-between items-center bg-white shadow-sm rounded-xl px-6 py-4 mb-8 mt-2 mx-4">
          {/* Ganti tulisan Dashboard jadi logo */}
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />

          <div className="flex items-center gap-4 relative">
            <button
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
              onClick={() => setShowNotif(!showNotif)}
            >
              <Bell size={20} className="text-gray-700" />
              {totalNotifikasi > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">
                  {totalNotifikasi}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-10 w-72 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                <div className="p-3 border-b">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Notifikasi
                  </h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {dashboard?.amountBooking ? (
                    <Link
                      href="/booking"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <BarChart3 className="text-green-600" size={18} />
                      <span className="text-sm text-gray-700">
                        {dashboard.amountBooking} booking baru masuk.
                      </span>
                    </Link>
                  ) : null}
                  {dashboard?.amountReport ? (
                    <Link
                      href="/reports"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <AlertTriangle className="text-red-500" size={18} />
                      <span className="text-sm text-gray-700">
                        {dashboard.amountReport} laporan kerusakan baru.
                      </span>
                    </Link>
                  ) : null}
                  {!dashboard?.amountBooking && !dashboard?.amountReport && (
                    <p className="text-sm text-gray-500 px-4 py-3 text-center">
                      Tidak ada notifikasi baru
                    </p>
                  )}
                </div>
              </div>
            )}

            <Link href="/settings">
              <button className="p-2 hover:bg-gray-100 rounded-full transition">
                <Settings size={20} className="text-gray-700" />
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <LogOut size={20} className="text-gray-700" />
            </button>
          </div>
        </header>

        {/* Greeting */}
        <section className="bg-gradient-to-br from-indigo-700 to-indigo-800 text-white rounded-xl shadow p-6 mb-8 mx-4">
          <div className="flex items-center gap-4">
            <div className="bg-white text-indigo-600 p-3 rounded-full shadow-inner">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Halo, {user?.username}</h2>
              <p className="text-sm opacity-90">
                Senang melihat Anda kembali. Semoga harimu menyenangkan!
              </p>
            </div>
          </div>
        </section>

        {/* Ringkasan */}
        <section className="mx-4 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Ringkasan</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SummaryCard
              title="Kelola Pengguna"
              value={dashboard?.amountUser}
              icon={<Users size={20} />}
              color="indigo"
              link="/customer"
            />
            <SummaryCard
              title="Kelola Laporan"
              value={dashboard?.amountReport}
              icon={<FileText size={20} />}
              color="red"
              link="/reports"
            />
            <SummaryCard
              title="Kelola Kamar"
              value={dashboard?.amountRoom}
              icon={<BedSingle size={20} />}
              color="yellow"
              link="/room"
            />
            <SummaryCard
              title="Fasilitas Umum"
              value={dashboard?.amountFacility}
              icon={<Package size={20} />}
              color="gray"
              link="/facility"
            />
            <SummaryCard
              title="Booking Masuk"
              value={dashboard?.amountBooking}
              icon={<BarChart3 size={20} />}
              color="green"
              link="/booking"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

// --- Komponen SidebarItem ---
function SidebarItem({
  href,
  icon,
  label,
  open,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  open: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-600 transition",
        !open && "justify-center"
      )}
      title={!open ? label : ""}
    >
      {icon}
      {open && <span>{label}</span>}
    </Link>
  );
}

// --- Komponen SummaryCard ---
function SummaryCard({
  title,
  value,
  icon,
  color,
  link,
}: {
  title: string;
  value: any;
  icon: React.ReactNode;
  color: string;
  link: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-100 text-green-600",
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>{icon}</div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">{title}</h4>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
      <button
        onClick={() => (window.location.href = link)}
        className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
      >
        <FileText size={16} className="mr-2" /> Lihat Semua
      </button>
    </div>
  );
}
