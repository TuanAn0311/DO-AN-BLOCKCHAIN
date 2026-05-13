// utils/web3.js - Đây là file tiện ích để kết nối với MetaMask và tương tác với Smart Contract
import { ethers } from "ethers";
import abi from "../contracts/DNCTraceABI.json";

// Dán Contract Address của bạn vào đây
const CONTRACT_ADDRESS = "0x3c9b9f6D6D50b8BA587A0F30D675923f4ba459C9";

export const connectMetaMask = async () => {
  // 1. Kiểm tra xem trình duyệt có cài MetaMask chưa
  if (!window.ethereum) {
    alert("Vui lòng cài đặt tiện ích ví MetaMask!");
    throw new Error("MetaMask not found");
  }

  try {
    // 2. Bật popup yêu cầu người dùng kết nối ví
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = accounts[0];

    // 3. Khởi tạo Provider (Đọc dữ liệu) và Signer (Ký giao dịch) theo chuẩn Ethers v6
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // 4. Kết nối với Smart Contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    console.log("Đã kết nối ví:", account);
    return { account, contract };
  } catch (error) {
    console.error("Lỗi kết nối MetaMask:", error);
    throw error;
  }
};
