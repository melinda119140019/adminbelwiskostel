/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MonitorCheck,
  Home,
  Trash2,
  Edit,
  Image,
  ArrowUpAZ,
  ArrowDownAZ,
  Search,
} from "lucide-react";
import api from "@/lib/api";
import AddRoomForm from "./components/AddRoom";
import { useToast } from "@/components/ToastContect";
import ConfirmDeleteModal from "@/components/ConfirmDeletedModal";
import { Facility, Room } from "./models";
import ModalFacility from "./components/FacilityModal";
import RoomImageModal from "./components/AddImageModal";
import { AddRoom } from "./services/service_room";
import http from "@/utils/http";
import UpdateRoomModal from "./components/EditRoomModal";

export default function RoomPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectId, setSelectId] = useState<string | null>(null);
  const [facilityModalOpen, setFacilityModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedFacilities, setSelectedFacilities] = useState<Facility[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [imageFacility, setImageFacility] = useState<Room | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const [sortAsc, setSortAsc] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/room");
      setRooms(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    const filtered = rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) =>
      sortAsc
        ? a.name.localeCompare(b.name, "id", { sensitivity: "base" })
        : b.name.localeCompare(a.name, "id", { sensitivity: "base" })
    );

    return filtered;
  }, [rooms, searchTerm, sortAsc]);

  const handleSortAlphabetically = () => setSortAsc(!sortAsc);

  const handleAddRoom = async (
    name: string,
    code: string,
    price: number,
    facility: Facility[]
  ) => {
    try {
      await AddRoom(name, code, price, facility);
      showToast("success", "Berhasil tambah kamar");
      fetchRooms();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || err.message);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/room/${deleteId}`);
      showToast("success", "Berhasil menghapus kamar");
      setRooms((prev) => prev.filter((r) => r._id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || err.message);
      setDeleteId(null);
    }
  };

  const handleOpenFacilityModal = async (roomId: string) => {
    try {
      const res = await http.get(`/room/${roomId}/facility`);
      setSelectedFacilities(res.data.data || []);
      setSelectedRoomId(roomId);
      setFacilityModalOpen(true);
    } catch {
      showToast("error", "Gagal memuat facility");
    }
  };

  const handleOpenUpdateModal = (roomId: string) => {
    setSelectId(roomId);
    setUpdateModalOpen(true);
  };

  const handleUpdateFacilityStatus = async (
    facilityCode: string,
    status: Facility["status"]
  ) => {
    if (!selectedRoomId) return;
    try {
      await api.patch(`/room/${selectedRoomId}/facility/${facilityCode}`, {
        status,
      });
      handleChangeStatus(facilityCode, status);
    } catch {
      showToast("error", "Gagal update status facility");
    }
  };

  const handleChangeStatus = (
    facilityCode: string,
    status: Facility["status"]
  ) => {
    setSelectedFacilities((prev) =>
      prev.map((f) => (f.code === facilityCode ? { ...f, status } : f))
    );
  };

  const handleAddFacility = async (facility: {
    code: string;
    name: string;
    status: Facility["status"];
  }) => {
    if (!selectedRoomId) {
      showToast("error", "Pilih room terlebih dahulu");
      return;
    }

    try {
      const res = await api.post(`/room/${selectedRoomId}/facility`, facility);
      const newFacility: Facility = res.data.data || facility;
      setSelectedFacilities((prev) => {
        if (prev.some((f) => f.code === newFacility.code)) return prev;
        return [...prev, newFacility];
      });
      showToast("success", "Facility berhasil ditambahkan");
    } catch (err: any) {
      showToast("error", err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center bg-white text-black shadow rounded-xl px-6 py-4 mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Home size={24} /> Data Room
        </h1>
      </header>

      <AddRoomForm onAdd={handleAddRoom} loading={loading} />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50 border rounded-lg px-4 py-3 mt-5">
        {/* Search input */}
        <div className="relative w-full sm:w-1/2">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Cari kamar berdasarkan nama atau kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort button */}
        <button
          onClick={handleSortAlphabetically}
          className="flex items-center gap-2 text-sm font-medium text-black hover:text-blue-600 transition"
        >
          {sortAsc ? (
            <>
              <ArrowDownAZ size={16} /> Urutkan Z - A
            </>
          ) : (
            <>
              <ArrowUpAZ size={16} /> Urutkan A - Z
            </>
          )}
        </button>
      </div>

      {/* Table */}
      <section className="bg-white rounded-xl shadow-md overflow-hidden mt-4">
        {error && (
          <p className="text-center text-red-600 p-4 font-semibold">{error}</p>
        )}

        <table className="w-full text-sm text-black">
          <thead>
            <tr className="bg-gray-100 text-black text-xs uppercase tracking-wider">
              <th className="p-3 text-left">Kode Kamar</th>
              <th className="p-3 text-left">Nama Kamar</th>
              <th className="p-3 text-right">Harga</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length > 0 ? (
              filteredRooms.map((r, idx) => (
                <tr
                  key={r._id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } border-b hover:bg-gray-100 transition`}
                >
                  <td className="p-3 font-medium text-black">{r.code}</td>
                  <td className="p-3 font-medium text-black">{r.name}</td>
                  <td className="p-3 text-right font-semibold text-black">
                    Rp {r.price.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-center">
                    {r.status ? (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        Tersedia
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                        Tidak Tersedia
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenFacilityModal(r._id)}
                        className="p-2 rounded-full border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 transition"
                        title="Lihat Fasilitas"
                      >
                        <MonitorCheck size={18} />
                      </button>

                      <button
                        onClick={() => handleOpenUpdateModal(r._id)}
                        className="p-2 rounded-full border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => setDeleteId(r._id)}
                        className="p-2 rounded-full border border-red-200 text-red-500 bg-white hover:bg-red-50 transition"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>

                      <button
                        onClick={() => {
                          setImageFacility(r);
                          setShowImageModal(true);
                        }}
                        className="p-2 rounded-full border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition"
                        title="Lihat Gambar"
                      >
                        <Image size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-500 italic"
                >
                  Tidak ada kamar yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onConfirm={handleDeleteRoom}
        onCancel={() => setDeleteId(null)}
        message="Yakin ingin menghapus room ini?"
      />

      <ModalFacility
        isOpen={facilityModalOpen}
        facilities={selectedFacilities}
        onClose={() => setFacilityModalOpen(false)}
        onUpdate={handleUpdateFacilityStatus}
        onAdd={handleAddFacility}
      />

      <UpdateRoomModal
        isOpen={updateModalOpen}
        room_id={selectId}
        onUpdate={fetchRooms}
        onClose={() => setUpdateModalOpen(false)}
      />

      {imageFacility && (
        <RoomImageModal
          room={imageFacility}
          show={showImageModal}
          onClose={() => setShowImageModal(false)}
          onUpdated={(updated) => {
            setRooms((prev) =>
              prev.map((x) => (x.code === updated.code ? updated : x))
            );
            setImageFacility(updated);
          }}
        />
      )}
    </div>
  );
}