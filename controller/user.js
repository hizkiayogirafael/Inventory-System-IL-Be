import { query } from "../database/db.js";
import { sendMail } from "./mailer.js"; // Mengimpor fungsi sendMail
import bcrypt from 'bcrypt'; // Tambahkan ini untuk menggunakan bcrypt

// Fungsi untuk menyetujui akun user
const approveUser = async (req, res) => {
    const { userId } = req.params;
    try {
        // Update status approved menjadi 1
        const result = await query("UPDATE user SET approved = 1 WHERE id_user = ?", [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        // Ambil email user untuk notifikasi
        const userResult = await query("SELECT email FROM user WHERE id_user = ?", [userId]);
        const user = userResult[0];

        // Kirim email notifikasi persetujuan
        await sendMail(user.email, 'Akun Anda Telah Disetujui', 'Selamat, akun Anda telah disetujui oleh admin.', '<p>Selamat, akun Anda telah disetujui oleh admin.</p>');

        return res.status(200).json({ msg: "Akun user telah disetujui" });
    } catch (error) {
        return res.status(500).json({ msg: "Terjadi kesalahan", error });
    }
};

// Mendapatkan semua user
const getAllUsers = async (req, res) => {
    try {
        const users = await query("SELECT * FROM user");
        return res.status(200).json({ msg: "Berhasil", data: users });
    } catch (error) {
        return res.status(400).json({ msg: "Terjadi kesalahan", error });
    }
};

// Menambahkan user baru (dengan status approved = 1)
const addUser = async (req, res) => {
    const { nama, email, password, telepon, nik, id_divisi, is_admin, id_perusahaan } = req.body;

    try {
        console.log('Data diterima:', req.body); // Log data yang diterima

        // Hash password sebelum menyimpan ke database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log('Password di-hash:', hashedPassword); // Log password yang di-hash

        // Tambahkan user baru ke database dengan status approved = 1
        const result = await query(
            "INSERT INTO user (nama, email, password, telepon, nik, id_divisi, is_admin, id_perusahaan, approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())",
            [nama, email, hashedPassword, telepon, nik, id_divisi, is_admin, id_perusahaan]
        );

        console.log('Hasil query:', result); // Log hasil query

        return res.status(201).json({ msg: "User berhasil ditambahkan" });
    } catch (error) {
        console.error('Error saat menambahkan user:', error); // Log error jika terjadi
        return res.status(400).json({ msg: "Gagal menambahkan user", error });
    }
};

// Mendapatkan user berdasarkan ID
const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await query("SELECT * FROM user WHERE id_user = ?", [id]);
        if (user.length === 0) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }
        return res.status(200).json({ msg: "Berhasil", data: user[0] });
    } catch (error) {
        return res.status(400).json({ msg: "Terjadi kesalahan", error });
    }
};

// Memperbarui user berdasarkan ID
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { nama, email, password, telepon, nik, id_divisi, is_admin, id_perusahaan } = req.body;

    try {
        // Jika password disertakan, hash password yang baru
        let hashedPassword = password;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        await query(
            "UPDATE user SET nama = ?, email = ?, password = ?, telepon = ?, nik = ?, id_divisi = ?, is_admin = ?, id_perusahaan = ? WHERE id_user = ?",
            [nama, email, hashedPassword, telepon, nik, id_divisi, is_admin, id_perusahaan, id]
        );

        return res.status(200).json({ msg: "User berhasil diubah" });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal mengubah user", error });
    }
};

// Menghapus user berdasarkan ID
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await query("DELETE FROM user WHERE id_user = ?", [id]);
        return res.status(200).json({ msg: "User berhasil dihapus" });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal menghapus user", error });
    }
};



export { approveUser, getAllUsers, addUser, getUserById, updateUser, deleteUser };
