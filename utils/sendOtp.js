// utils/sendOtp.js  ← new file
import axios from "axios";

export const sendOTP = async (phone, otp) => {
  const number = phone.replace(/^\+91/, "");
  try {
    await axios.post("https://www.fast2sms.com/dev/bulkV2", {
      route: "q",
      message: `Your OTP is ${otp}`,
      language: "english",
      numbers: number,
    }, {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
      },
    });
  } catch (err) {
    console.log("Fast2SMS error:", err.response?.data);
  }
};