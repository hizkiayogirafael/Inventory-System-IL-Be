import cron from 'node-cron';
import { query } from "./database/db.js";
import { sendMail } from "./controller/mailer.js";

const checkReturnDeadlines = async () => {
    try {
        // Mendapatkan semua peminjaman yang mendekati tenggat waktu (1 hari sebelum tenggat)
        const peminjaman = await query(`
            SELECT p.*, u.email, u.nama 
            FROM peminjaman p 
            JOIN user u ON p.id_user = u.id_user 
            WHERE p.id_status_peminjaman = 2 
            AND p.tanggal_kembali = CURDATE() + INTERVAL 1 DAY
        `);

        // Kirim notifikasi email untuk setiap peminjaman yang mendekati tenggat waktu
        peminjaman.forEach(async (pinjam) => {
            const { email, nama, id_barang, tanggal_kembali } = pinjam;

            const subject = "Peringatan Tenggat Waktu Pengembalian Barang";
            const text = `Halo ${nama},\n\nIni adalah pengingat bahwa barang yang Anda pinjam (ID Barang: ${id_barang}) harus dikembalikan pada ${tanggal_kembali}. Harap pastikan barang dikembalikan tepat waktu.\n\nTerima kasih.`;
            const html = `<p>Halo ${nama},</p><p>Ini adalah pengingat bahwa barang yang Anda pinjam (ID Barang: ${id_barang}) harus dikembalikan pada ${tanggal_kembali}. Harap pastikan barang dikembalikan tepat waktu.</p><p>Terima kasih.</p>`;

            await sendMail(email, subject, text, html);
        });
    } catch (error) {
        console.error("Error saat memeriksa tenggat pengembalian:", error);
    }
};

// Menjalankan cron job setiap hari pada jam 8 pagi
cron.schedule('0 8 * * *', () => {
    console.log("Memeriksa tenggat pengembalian barang...");
    checkReturnDeadlines();
});
