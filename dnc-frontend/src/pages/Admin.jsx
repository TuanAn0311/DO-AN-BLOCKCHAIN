import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { connectMetaMask } from '../utils/web3';

const Admin = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    
    // State cho Form thêm công đoạn
    const [stageName, setStageName] = useState('');
    const [stageNote, setStageNote] = useState('');
    
    // State cho UI Loading
    const [isLoading, setIsLoading] = useState(false);

    // Kiểm tra quyền Admin & Tải danh sách sản phẩm
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('Vui lòng đăng nhập!');
            return navigate('/login');
        }
        
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang này!');
            return navigate('/products');
        }

        const fetchProducts = async () => {
            const res = await api.get('/products');
            setProducts(res.data.data);
            if (res.data.data.length > 0) setSelectedProduct(res.data.data[0].id);
        };
        fetchProducts();
    }, [navigate]);

    // HÀM 1: Thêm công đoạn vào MySQL (Off-chain)
    const handleAddStage = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                product_id: selectedProduct,
                stage: stageName,
                data: { 
                    note: stageNote,
                    updated_by: JSON.parse(localStorage.getItem('user')).full_name
                }
            };
            await api.post('/supply-chain/stage', payload);
            alert('Đã thêm công đoạn vào cơ sở dữ liệu!');
            setStageName('');
            setStageNote('');
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi khi thêm công đoạn');
        }
    };

    // HÀM 2: Quy trình Ký Blockchain (On-chain)
    const handleSignBlockchain = async () => {
        if (!selectedProduct) return alert('Vui lòng chọn sản phẩm!');
        setIsLoading(true);

        try {
            // Bước 1: Lấy mã Hash tổng hợp từ Backend
            const resHash = await api.get(`/supply-chain/generate-hash/${selectedProduct}`);
            const hashToStore = resHash.data.hash;
            console.log("Dữ liệu gốc:", resHash.data.data_preview);

            // Bước 2: Gọi ví MetaMask của Admin
            const { account, contract } = await connectMetaMask();

            // Bước 3: Gửi giao dịch lên Blockchain (Tốn Gas)
            // Lưu ý: storeHash là tên hàm trong Smart Contract
            const tx = await contract.storeHash(selectedProduct, hashToStore);
            
            alert('Đang chờ mạng lưới xác nhận giao dịch... Vui lòng không đóng trình duyệt.');
            
            // Bước 4: Chờ block được đào (mined) thành công
            const receipt = await tx.wait(); 
            
            // Bước 5: Gửi lại Transaction Hash (Biên lai) cho Backend lưu trữ
            await api.post('/supply-chain/record', {
                product_id: selectedProduct,
                hash: hashToStore,
                tx_hash: receipt.hash // Đây là mã giao dịch trên Blockchain
            });

            alert('🎉 Đóng dấu Blockchain thành công! Sản phẩm đã được bảo vệ.');
        } catch (error) {
            console.error(error);
            // MetaMask quăng lỗi nếu Admin bấm "Từ chối" ký
            if (error.code === 'ACTION_REJECTED') {
                alert('Bạn đã hủy giao dịch trên ví MetaMask.');
            } else {
                alert(error.reason || 'Lỗi khi ghi lên Blockchain. Bạn đã ghi Hash cho sản phẩm này rồi chăng?');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Bảng điều khiển Admin (DNC-Trace)</h2>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
                <h3>1. Chọn Sản phẩm cần quản lý</h3>
                <select 
                    value={selectedProduct} 
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                >
                    {products.map(p => (
                        <option key={p.id} value={p.id}>ID: {p.id} - {p.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                {/* CỘT TRÁI: Thêm lịch sử */}
                <div style={{ padding: '20px', border: '1px solid #17a2b8', borderRadius: '8px' }}>
                    <h3 style={{ color: '#17a2b8', marginTop: 0 }}>2. Cập nhật chuỗi cung ứng</h3>
                    <form onSubmit={handleAddStage} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input 
                            placeholder="Tên công đoạn (vd: Thu hoạch, Rang xay...)" 
                            value={stageName} onChange={(e) => setStageName(e.target.value)} required 
                            style={{ padding: '10px' }}
                        />
                        <textarea 
                            placeholder="Ghi chú chi tiết (vd: Nhiệt độ 180 độ C, người thực hiện...)" 
                            value={stageNote} onChange={(e) => setStageNote(e.target.value)} required 
                            style={{ padding: '10px', height: '100px' }}
                        />
                        <button type="submit" style={{ padding: '10px', background: '#17a2b8', color: 'white', border: 'none', cursor: 'pointer' }}>
                            ➕ Thêm vào Database
                        </button>
                    </form>
                </div>

                {/* CỘT PHẢI: Ghi Blockchain */}
                <div style={{ padding: '20px', border: '1px solid #28a745', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <h3 style={{ color: '#28a745', marginTop: 0 }}>3. Đóng dấu Blockchain</h3>
                    <p style={{ fontSize: '14px', color: '#555' }}>
                        Gom toàn bộ dữ liệu hiện tại của sản phẩm này và ghi lên Smart Contract để đảm bảo tính bất biến.
                    </p>
                    <button 
                        onClick={handleSignBlockchain}
                        disabled={isLoading}
                        style={{ 
                            padding: '15px 30px', background: isLoading ? '#ccc' : '#28a745', 
                            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' 
                        }}
                    >
                        {isLoading ? '⏳ Đang xử lý Web3...' : '⛓️ Ký duyệt lên Blockchain'}
                    </button>
                    <small style={{ color: 'red', marginTop: '10px' }}>*Chỉ thực hiện khi chuỗi cung ứng đã hoàn tất.</small>
                </div>
            </div>
        </div>
    );
};

export default Admin;