import { query } from "../database/db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendMail } from "../controller/mailer.js"; // Mengimpor fungsi sendMail

// Fungsi Register
const register = async (req, res) => {
    const { nama, email, password, telepon, nik, id_divisi, id_perusahaan } = req.body;
    try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Simpan pengguna ke database dengan status belum disetujui (approved = 0)
        const result = await query(
            `INSERT INTO user 
            (nama, email, password, telepon, nik, id_divisi, id_perusahaan, is_admin, approved, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NOW())`,
            [nama, email, hashedPassword, telepon, nik, id_divisi, id_perusahaan]
        );

        // Kirim email notifikasi pendaftaran berhasil
        await sendMail(email, 'Registrasi Berhasil', 'Terima kasih telah mendaftar. Akun Anda akan segera diperiksa oleh admin.', 
            '<p>Terima kasih telah mendaftar. Akun Anda akan segera diperiksa oleh admin.</p>');

        return res.status(201).json({ msg: "Registrasi berhasil, menunggu persetujuan admin." });
    } catch (error) {
        return res.status(500).json({ msg: "Terjadi kesalahan", error });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Query untuk mendapatkan user berdasarkan email
        const result = await query("SELECT * FROM user WHERE email = ?", [email]);
        const user = result[0];

        if (!user) {
            return res.status(404).json({ msg: "Email tidak ditemukan" });
        }

        // Cek apakah akun sudah disetujui
        if (user.approved === 0) {
            return res.status(403).json({ msg: "Akun Anda belum disetujui oleh admin." });
        }

        // Verifikasi password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: "Password Anda salah" });
        }

        // Cek apakah pengguna adalah admin
        const isAdmin = user.is_admin === 1;

        // Buat JWT
        const token = jwt.sign(
            { id: user.id_user, email: user.email, isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Kirim respons dengan token dan informasi user
        return res.status(200).json({
            msg: "Login berhasil",
            token,
            user: {
                id: user.id_user,
                nama: user.nama,
                email: user.email,
                telepon: user.telepon,
                is_admin: isAdmin
            }
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ msg: "Terjadi kesalahan", error });
    }
};

export { login, register };
