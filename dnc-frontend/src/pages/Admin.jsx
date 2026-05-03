import { useEffect, useState } from 'react';
import api from '../services/api';
import { connectMetaMask } from '../utils/web3';

// 1. ĐỊNH NGHĨA QUY TRÌNH CHUẨN (Workflow) CẤP DOANH NGHIỆP
const STANDARD_WORKFLOW = [
    "1. Thu hoạch & Phân loại",
    "2. Sơ chế & Lên men",
    "3. Phơi khô & Lưu kho",
    "4. Rang xay & Phối trộn",
    "5. Kiểm định chất lượng (QC)",
    "6. Đóng gói & Xuất xưởng"
];

const Admin = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [currentHistory, setCurrentHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // State cho form dữ liệu chi tiết
    const [location, setLocation] = useState('');
    const [environment, setEnvironment] = useState('');
    const [inspector, setInspector] = useState('');
    const [extraNote, setExtraNote] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data.data);
            } catch (error) {
                console.error("Lỗi lấy sản phẩm:", error);
            }
        };
        fetchProducts();
    }, []);

    const fetchCurrentStatus = async (productId) => {
        if (!productId) {
            setCurrentHistory([]);
            return;
        }
        try {
            const { contract } = await connectMetaMask();
            const history = await contract.getHistory(productId);
            
            const formatted = history.map(item => ({
                stageName: item.stageName,
                timestamp: Number(item.timestamp) * 1000,
                updatedBy: item.updatedBy,
                note: item.note // Chứa chuỗi JSON
            }));
            
            setCurrentHistory(formatted);
        } catch (error) {
            console.error("Lỗi lấy lịch sử:", error);
        }
    };

    useEffect(() => {
        fetchCurrentStatus(selectedProduct);
    }, [selectedProduct]);

    // TÍNH TOÁN BƯỚC TIẾP THEO
    const nextStepIndex = currentHistory.length;
    const isCompleted = nextStepIndex >= STANDARD_WORKFLOW.length;
    const nextStageName = isCompleted ? "Đã hoàn tất quy trình" : STANDARD_WORKFLOW[nextStepIndex];

    const handleAddStage = async (e) => {
        e.preventDefault();
        if (!selectedProduct || isCompleted) return;

        setIsLoading(true);
        try {
            const { contract } = await connectMetaMask();
            const user = JSON.parse(localStorage.getItem('user'));
            const adminName = user?.full_name || "Admin DNC";

            // 2. ĐÓNG GÓI DỮ LIỆU THÀNH JSON
            // Việc này giúp lưu trữ chuyên nghiệp và dễ dàng parse (tách) ra ở Frontend sau này
            const structuredData = JSON.stringify({
                location: location || "Không có",
                environment: environment || "Tiêu chuẩn",
                inspector: inspector || adminName,
                details: extraNote || "Không có"
            });

            const tx = await contract.addStage(
                selectedProduct,
                nextStageName, // Dùng tên bước chuẩn đã tính toán, cấm nhập tay
                structuredData, 
                adminName
            );

            alert(`⏳ Đang ghi công đoạn: "${nextStageName}" lên Blockchain...`);
            await tx.wait(); 

            alert("🎉 Đã ghi lịch sử thành công!");
            
            // Reset form và tải lại lịch sử
            setLocation(''); setEnvironment(''); setInspector(''); setExtraNote('');
            fetchCurrentStatus(selectedProduct);

        } catch (error) {
            console.error("Lỗi:", error);
            alert("Lỗi khi ghi dữ liệu lên Blockchain.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Bảng điều khiển Admin (Enterprise Grade)</h2>

            {/* BƯỚC 1: Chọn sản phẩm */}
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
                <h3>1. Chọn Sản phẩm cần quản lý</h3>
                <select 
                    value={selectedProduct} 
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '5px' }}
                >
                    <option value="">-- Vui lòng chọn một sản phẩm --</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>ID: {p.id} - {p.name}</option>
                    ))}
                </select>
            </div>

            {selectedProduct && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    
                    {/* CỘT TRÁI: Tiến độ hiện tại */}
                    <div style={{ padding: '20px', background: '#e9ecef', borderRadius: '8px', borderLeft: '5px solid #007bff' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#0056b3' }}>📍 Tiến độ Chuỗi cung ứng:</h4>
                        
                        {STANDARD_WORKFLOW.map((stage, index) => {
                            const isDone = index < nextStepIndex;
                            const isCurrent = index === nextStepIndex;
                            return (
                                <div key={index} style={{ 
                                    padding: '10px', marginBottom: '8px', borderRadius: '5px',
                                    background: isDone ? '#d4edda' : (isCurrent ? '#cce5ff' : '#fff'),
                                    border: isCurrent ? '2px solid #007bff' : '1px solid #ccc',
                                    color: isDone ? '#155724' : (isCurrent ? '#004085' : '#6c757d'),
                                    display: 'flex', alignItems: 'center', gap: '10px'
                                }}>
                                    {isDone ? '✅' : (isCurrent ? '🔄' : '⏳')} {stage}
                                </div>
                            );
                        })}
                    </div>

                    {/* CỘT PHẢI: Form nhập liệu được kiểm soát chặt chẽ */}
                    <div style={{ padding: '20px', border: '2px solid #28a745', borderRadius: '8px', background: '#f4fff5' }}>
                        <h3 style={{ color: '#28a745', marginTop: 0 }}>⛓️ Khắc dữ liệu lên Blockchain</h3>
                        
                        {isCompleted ? (
                            <div style={{ padding: '20px', background: '#d4edda', color: '#155724', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' }}>
                                Sản phẩm này đã hoàn tất toàn bộ quy trình cung ứng.
                            </div>
                        ) : (
                            <form onSubmit={handleAddStage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                
                                {/* Tên công đoạn bị khóa cứng (Read-only) */}
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Công đoạn tiếp theo (Tự động):</label>
                                    <input value={nextStageName} disabled style={{ width: '100%', padding: '10px', background: '#e9ecef', border: '1px solid #ccc', fontWeight: 'bold', color: '#333', marginTop: '5px' }} />
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Địa điểm thực hiện:</label>
                                    <input required placeholder="VD: Nông trại Cầu Đất, Lâm Đồng..." value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', marginTop: '5px' }} />
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Thông số kỹ thuật / Môi trường:</label>
                                    <input required placeholder="VD: Nhiệt độ 180°C, Độ ẩm 12%..." value={environment} onChange={(e) => setEnvironment(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', marginTop: '5px' }} />
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Người/Đơn vị kiểm duyệt:</label>
                                    <input required placeholder="VD: Kỹ sư Nguyễn Văn A..." value={inspector} onChange={(e) => setInspector(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', marginTop: '5px' }} />
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Ghi chú bổ sung:</label>
                                    <textarea placeholder="Chứng nhận, mô tả thêm..." value={extraNote} onChange={(e) => setExtraNote(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', marginTop: '5px', height: '60px' }} />
                                </div>

                                <button type="submit" disabled={isLoading} style={{ padding: '15px', background: isLoading ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                                    {isLoading ? '⏳ Đang ký duyệt...' : 'Đóng dấu Blockchain ➔'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;