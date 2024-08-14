import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail", 
  auth: {
    user: "rafaelyogisitorus@gmail.com",
    pass: "bwxi qfow pojz glqt",
  },
});

const sendMail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: "rafaelyogisitorus@gmail.com",
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export { sendMail };
