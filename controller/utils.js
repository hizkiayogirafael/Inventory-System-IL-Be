import { query } from "../database/db.js";

export const getOptions = async (req, res) => {
    try {
        const perusahaan = await query("SELECT * FROM perusahaan");
        const divisi = await query("SELECT * FROM divisi");
        const supplier = await query("SELECT * FROM supplier");
        const kategori = await query("SELECT * FROM kategori");
        const statusBarang = await query("SELECT * FROM status_barang");

        return res.status(200).json({ msg: "Berhasil", perusahaan: perusahaan, divisi: divisi, supplier: supplier, kategori: kategori, statusBarang: statusBarang });
    } catch (error) {
        return res.status(400).json({ msg: "Terjadi kesalahan", error });
    }
};