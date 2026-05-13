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

    const [finalStock, setFinalStock] = useState(''); // luu số lượng thành phần cuối cùng để kích hoạt sản phẩm sau bước 6

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
            let dynamicJson = {};
            if (nextStepIndex === 0) dynamicJson = { "Nông trại": location, "Giống": environment, "Tỷ lệ chín": extraNote + "%" };
            if (nextStepIndex === 1) dynamicJson = { "Phương pháp": location, "Thời gian lên men": environment };
            if (nextStepIndex === 2) dynamicJson = { "Độ ẩm": location, "Thời gian phơi": environment };
            if (nextStepIndex === 3) dynamicJson = { "Mức rang": location, "Nhiệt độ": environment, "Thợ rang": inspector };
            if (nextStepIndex === 4) dynamicJson = { "Điểm Cupping": location, "Hương vị": environment, "Q-Grader": inspector };
            if (nextStepIndex === 5) dynamicJson = { "Đóng gói": location, "Hạn sử dụng": environment, "Lô sản xuất": finalStock + " sản phẩm" };

            const structuredData = JSON.stringify(dynamicJson);

            // VALIDATE RIÊNG CHO BƯỚC 6 (Tránh mất phí Gas nếu Admin quên nhập số lượng)
            if (nextStageName === "6. Đóng gói & Xuất xưởng" && (!finalStock || finalStock < 1)) {
                setIsLoading(false);
                return alert("Vui lòng nhập số lượng thành phẩm hợp lệ trước khi ký!");
            }

            const tx = await contract.addStage(
                selectedProduct,
                nextStageName, // Dùng tên bước chuẩn đã tính toán, cấm nhập tay
                structuredData, 
                adminName
            );

            alert(`⏳ Đang ghi công đoạn: "${nextStageName}" lên Blockchain...`);
            await tx.wait(); 

            //Kiểm tra nếu là bước cuối cùng
            if (nextStageName === "6. Đóng gói & Xuất xưởng") {
                try {
                    await api.put(`/products/activate/${selectedProduct}`, { stock: finalStock }); // Kích hoạt sản phẩm trên hệ thống sau khi bước cuối cùng được ghi thành công
                    alert("🎉 Sản phẩm đã được kích hoạt trên hệ thống và sẵn sàng đến tay người tiêu dùng!")
                    setFinalStock('');
                }catch (error) {
                    console.error("Lỗi kích hoạt sản phẩm:", error);
                    alert("Lỗi khi kích hoạt sản phẩm trên hệ thống!");
                }
            } else {
                alert(`🎉 Công đoạn "${nextStageName}" đã được ghi thành công lên Blockchain!`);
            };
                        
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
            <button 
                onClick={() => window.location.href = '/admin/products'}
                style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px', marginRight: '10px' }}
            >   
                Quản lý kho hàng & sản phẩm
            </button>

            <button 
                onClick={() => window.location.href = '/admin/orders'}
                style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px', marginRight: '10px' }}
            >
                Quản lý đơn hàng
            </button>

            <button 
                onClick={() => window.location.href = '/admin/dashboard'}
                style={{ padding: '10px 20px', background: '#ffc107', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px', marginRight: '10px' }}
            >
                Bảng điều khiển thống kê
            </button>
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
                            <form onSubmit={handleAddStage} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Công đoạn tiếp theo:</label>
                                    <input value={nextStageName} disabled style={{ width: '100%', padding: '10px', background: '#e9ecef', border: '1px solid #ccc', fontWeight: 'bold', color: '#333', marginTop: '5px' }} />
                                </div>

                                {/* RENDER FORM ĐỘNG DỰA THEO BƯỚC HIỆN TẠI */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '5px' }}>
                                    
                                    {nextStepIndex === 0 && (
                                        <>
                                            <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>🌾 Thông số Thu hoạch</div>
                                            <input required placeholder="Nông trại / Vùng trồng (VD: Cầu Đất...)" onChange={(e) => setLocation(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            <input required placeholder="Giống cà phê (VD: Arabica Typica...)" onChange={(e) => setEnvironment(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            <select
                                                required
                                                onChange={(e) => setExtraNote(e.target.value)}
                                                style={{
                                                    padding: '10px',
                                                    border: '1px solid #ccc',
                                                    width: '100%',
                                                    borderRadius: '5px'
                                                }}
                                            >
                                                <option value="">-- Chọn tỷ lệ quả chín (%) --</option>

                                                {Array.from({ length: 101 }, (_, i) => (
                                                    <option key={i} value={`${i}%`}>
                                                        {i}%
                                                    </option>
                                                ))}
                                            </select>                                        
                                        </>
                                    )}

                                    {nextStepIndex === 1 && (
                                        <>
                                            <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>💧 Thông số Sơ chế</div>
                                            <input required placeholder="Phương pháp (VD: Washed, Honey, Natural...)" onChange={(e) => setLocation(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            <input required placeholder="Thời gian lên men (VD: 24h, 48h...)" onChange={(e) => setEnvironment(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                        </>
                                    )}

                                    {nextStepIndex === 2 && (
                                        <>
                                            <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>☀️ Thông số Phơi khô</div>
                                            <input required placeholder="Độ ẩm đạt được (VD: 11% - 12%)" onChange={(e) => setLocation(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            <input required placeholder="Thời gian phơi (VD: 10 ngày)" onChange={(e) => setEnvironment(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                        </>
                                    )}

                                    {nextStepIndex === 3 && (
                                        <>
                                            <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>🔥 Thông số Rang xay</div>
                                            <input required placeholder="Mức rang (VD: Medium Roast, Dark Roast)" onChange={(e) => setLocation(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            <input required placeholder="Nhiệt độ rang (VD: 210°C)" onChange={(e) => setEnvironment(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            <input required placeholder="Chuyên gia rang (Thợ rang chính)" onChange={(e) => setInspector(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                        </>
                                    )}

                                    {nextStepIndex === 4 && (
                                        <>
                                            <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>🔬 Kiểm định chất lượng (QC)</div>
                                            <input required placeholder="Điểm Cupping (SCA Score) - VD: 84 điểm" onChange={(e) => setLocation(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            <input required placeholder="Hương vị (Notes) - VD: Chocolate, Caramel..." onChange={(e) => setEnvironment(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            <input required placeholder="Chuyên gia Q-Grader (Người kiểm định)" onChange={(e) => setInspector(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                        </>
                                    )}

                                    {nextStepIndex === 5 && (
                                        <>
                                            <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>📦 Đóng gói & Xuất xưởng</div>
                                            <input required placeholder="Quy cách đóng gói (VD: Túi Kraft 250g, Van 1 chiều)" onChange={(e) => setLocation(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            <input required placeholder="Hạn sử dụng (VD: 12 tháng kể từ NSX)" onChange={(e) => setEnvironment(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', width: '95%' }} />
                                            
                                            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '5px', border: '1px solid #ffeeba', marginTop: '10px' }}>
                                                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#856404' }}>📦 Số lượng thành phẩm thực tế (Nhập kho):</label>
                                                <input 
                                                    type="number" 
                                                    required 
                                                    placeholder="Nhập số lượng túi/hộp đạt chuẩn..." 
                                                    value={finalStock} 
                                                    onChange={(e) => setFinalStock(e.target.value)} 
                                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', marginTop: '8px', fontSize: '16px', fontWeight: 'bold' }} 
                                                />
                                                <small style={{ color: '#856404', display: 'block', marginTop: '5px' }}>*Sau khi hoàn tất bước này, sản phẩm sẽ chính thức được mở bán.</small>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button type="submit" disabled={isLoading} style={{ padding: '15px', background: isLoading ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '16px' }}>
                                    {isLoading ? '⏳ Đang chờ MetaMask xử lý...' : 'Ký duyệt lên Blockchain ➔'}
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