import { query } from "../database/db.js";

export const getOptions = async (req, res) => {
    try {
        const perusahaan = await query("SELECT * FROM perusahaan");
        const divisi = await query("SELECT * FROM divisi");

        return res.status(200).json({ msg: "Berhasil", perusahan: perusahaan, divisi: divisi });
    } catch (error) {
        return res.status(400).json({ msg: "Terjadi kesalahan", error });
    }
};