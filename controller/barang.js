import { query } from "../database/db.js";

// Mendapatkan semua barang
const getAllBarang = async (req, res) => {
    try {
        const barang = await query("SELECT * FROM barang");
        return res.status(200).json({ msg: "Berhasil", data: barang });
    } catch (error) {
        return res.status(400).json({ msg: "Terjadi kesalahan", error });
    }
};

// Menambahkan barang baru
const addBarang = async (req, res) => {
    const { nama_barang, jumlah, id_supplier, id_perusahaan, id_status_barang, tanggal_pembelian_barang, lokasi_barang, id_kategori, nomor_seri } = req.body;

    try {
        // Tambahkan barang baru ke tabel barang
        const result = await query(
            "INSERT INTO barang (nama_barang, jumlah, id_supplier, id_perusahaan, id_status_barang, tanggal_pembelian_barang, lokasi_barang, id_kategori, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
            [nama_barang, jumlah, id_supplier, id_perusahaan, id_status_barang, tanggal_pembelian_barang, lokasi_barang, id_kategori]
        );

        const id_barang = result.insertId;

        // Tambahkan nomor seri ke tabel serial_number
        for (let i = 0; i < jumlah; i++) {
            await query(
                "INSERT INTO serial_number (id_barang, nomor_seri) VALUES (?, ?)",
                [id_barang, nomor_seri[i]]
            );
        }

        return res.status(201).json({ msg: "Barang dan nomor seri berhasil ditambahkan." });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal menambahkan barang", error });
    }
};

// Mendapatkan barang berdasarkan ID
const getBarangById = async (req, res) => {
    const { id } = req.params;
    try {
        const barang = await query("SELECT * FROM barang WHERE id_barang = ?", [id]);
        if (barang.length === 0) {
            return res.status(404).json({ msg: "Barang tidak ditemukan" });
        }
        return res.status(200).json({ msg: "Berhasil", data: barang[0] });
    } catch (error) {
        return res.status(400).json({ msg: "Terjadi kesalahan", error });
    }
};

// Memperbarui barang berdasarkan ID
const updateBarang = async (req, res) => {
    const { id } = req.params;
    const { nama_barang, jumlah, id_supplier, id_perusahaan, id_status_barang, tanggal_pembelian_barang, lokasi_barang } = req.body;

    try {
        await query(
            "UPDATE barang SET nama_barang = ?, jumlah = ?, id_supplier = ?, id_perusahaan = ?, id_status_barang = ?, tanggal_pembelian_barang = ?, lokasi_barang = ? WHERE id_barang = ?",
            [nama_barang, jumlah, id_supplier, id_perusahaan, id_status_barang, tanggal_pembelian_barang, lokasi_barang, id]
        );
        return res.status(200).json({ msg: "Barang berhasil diubah" });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal mengubah barang", error });
    }
};

// Menghapus barang berdasarkan ID
const deleteBarang = async (req, res) => {
    const { id } = req.params;
    try {
        await query("DELETE FROM barang WHERE id_barang = ?", [id]);
        return res.status(200).json({ msg: "Barang berhasil dihapus" });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal menghapus barang", error });
    }
};

export { getAllBarang, addBarang, getBarangById, updateBarang, deleteBarang };
