import { query } from "../database/db.js";
import { sendMail } from "./mailer.js"; // Mengimpor fungsi sendMail
import bcrypt from 'bcrypt'; // Tambahkan ini untuk menggunakan bcrypt

// Fungsi untuk menyetujui akun user
const approveUser = async (req, res) => {
    const { id } = req.params; // Sesuaikan dengan parameter di routing
    try {
        // Update status approved menjadi 1
        const result = await query("UPDATE user SET approved = 1 WHERE id_user = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        // Ambil email user untuk notifikasi
        const userResult = await query("SELECT email FROM user WHERE id_user = ?", [id]);
        const user = userResult[0];

        // Kirim email notifikasi persetujuan jika email ada
        if (user?.email) {
            await sendMail(user.email, 'Akun Anda Telah Disetujui', 'Selamat, akun Anda telah disetujui oleh admin.', '<p>Selamat, akun Anda telah disetujui oleh admin.</p>');
        }

        return res.status(200).json({ msg: "Akun user telah disetujui" });
    } catch (error) {
        console.error("Error approving user:", error);
        return res.status(500).json({ msg: "Terjadi kesalahan", error });
    }
};



// Mendapatkan semua user
const getAllUsers = async (req, res) => {
    try {
        const users = await query(`
            SELECT 
                u.id_user, 
                u.nama, 
                u.email, 
                u.approved,
                u.telepon, 
                u.nik, 
                d.nama_divisi, 
                p.nama_perusahaan
            FROM 
                user u
            LEFT JOIN 
                divisi d ON u.id_divisi = d.id_divisi
            LEFT JOIN 
                perusahaan p ON u.id_perusahaan = p.id_perusahaan
        `);

        return res.status(200).json({ msg: "Berhasil", data: users });
    } catch (error) {
        return res.status(400).json({ msg: "Terjadi kesalahan", error });
    }
};


// Menambahkan user baru (dengan status approved = 1)
const addUser = async (req, res) => {
    const { nama, email, password, telepon, nik, id_divisi, id_perusahaan } = req.body;

    try {
        console.log('Data diterima:', req.body); // Log data yang diterima

        // Hash password sebelum menyimpan ke database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);   

        console.log('Password di-hash:', hashedPassword); // Log password yang di-hash

        // Tambahkan user baru ke database dengan is_admin otomatis menjadi 0 dan approved menjadi 1
        const result = await query(
            "INSERT INTO user (nama, email, password, telepon, nik, id_divisi, is_admin, id_perusahaan, approved, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, NOW())",
            [nama, email, hashedPassword, telepon, nik, id_divisi, id_perusahaan]
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
        const user = await query(`
            SELECT u.id_user, u.nama, u.email, u.telepon, u.nik, d.nama_divisi, p.nama_perusahaan, u.password 
            FROM user u
            LEFT JOIN divisi d ON u.id_divisi = d.id_divisi
            LEFT JOIN perusahaan p ON u.id_perusahaan = p.id_perusahaan
            WHERE u.id_user = ?
        `, [id]);

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
    const { nama, email, password, telepon, nik, id_divisi, id_perusahaan, approved } = req.body;

    try {
        let hashedPassword;
        let isAdmin;

        // Hanya lakukan hashing jika password dikirimkan
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        } else {
            // Jika tidak ada password baru, ambil password lama dari database
            const result = await query("SELECT password, is_admin FROM user WHERE id_user = ?", [id]);
            hashedPassword = result[0].password;
            isAdmin = result[0].is_admin;  // Ambil nilai is_admin dari database
        }

        // Update user dengan password yang sudah di-hash (atau yang lama)
        await query(
            "UPDATE user SET nama = ?, email = ?, password = ?, telepon = ?, nik = ?, id_divisi = ?, is_admin = ?, id_perusahaan = ?, approved = ? WHERE id_user = ?",
            [nama, email, hashedPassword, telepon, nik, id_divisi, isAdmin, id_perusahaan, approved, id]
        );

        return res.status(200).json({ msg: "User berhasil diubah" });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal mengubah user", error });
    }
};

const updateProfile = async (req, res) => {
    const { id } = req.params;
    const { nama, email, telepon, nik, id_divisi, id_perusahaan } = req.body;

    try {
        // Ambil data lama dari database
        const result = await query("SELECT nama, email, password, telepon, nik, id_divisi, id_perusahaan FROM user WHERE id_user = ?", [id]);
        if (result.length === 0) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        const existingUser = result[0];

        // Gunakan data baru jika ada, atau gunakan data lama jika data baru kosong
        const updatedNama = nama || existingUser.nama;
        const updatedEmail = email || existingUser.email;
        const updatedTelepon = telepon || existingUser.telepon;
        const updatedNik = nik || existingUser.nik;
        const updatedDivisi = id_divisi || existingUser.id_divisi;
        const updatedPerusahaan = id_perusahaan || existingUser.id_perusahaan;

        // Update user dengan data yang diperbarui
        await query(
            "UPDATE user SET nama = ?, email = ?, telepon = ?, nik = ?, id_divisi = ?, id_perusahaan = ? WHERE id_user = ?",
            [updatedNama, updatedEmail, updatedTelepon, updatedNik, updatedDivisi, updatedPerusahaan, id]
        );

        return res.status(200).json({ msg: "Profile berhasil diubah" });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal mengubah profile", error });
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

export { approveUser, getAllUsers, addUser, getUserById, updateUser, deleteUser, updateProfile };
