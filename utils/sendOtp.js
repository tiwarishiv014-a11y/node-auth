// utils/sendOtp.js  ← new file
import axios from "axios";

export const sendOTP = async (phone, otp) => {
  const number = phone.replace(/^\+91/, ""); // Fast2SMS needs 10-digit number

  await axios.get("https://www.fast2sms.com/dev/bulkV2", {
    params: {
      authorization: process.env.FAST2SMS_API_KEY,
      variables_values: otp,
      route: "otp",
      numbers: number,
    },
  });
};