import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { connectMetaMask } from '../utils/web3';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [product, setProduct] = useState(null);
    const [blockchainHistory, setBlockchainHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const fetchBlockchainData = async () => {
            try {
                // 1. Lấy thông tin sản phẩm
                const resProd = await api.get(`/products/${id}`);
                const productData = resProd.data.data;

                //Chặn truy cập nếu sản phẩm chưa được kích hoạt (status=0)
                if(productData.status === 0) {
                    alert("Sản phẩm này chưa được mở bán hoặc đang trong quá trình sản xuất!");
                    navigate('/products');
                    return;// dừng chạy code bên dưới
                }

                setProduct(productData);

                // 2. Lấy lịch sử từ Smart Contract
                const { contract } = await connectMetaMask();
                const historyData = await contract.getHistory(id);
                
                const formattedHistory = historyData.map(item => ({
                    stageName: item.stageName,
                    note: item.note,
                    updatedBy: item.updatedBy,
                    timestamp: Number(item.timestamp) * 1000 
                }));

                setBlockchainHistory(formattedHistory);
            } catch (error) {
                console.error("Lỗi truy xuất Blockchain:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchReviews = async () => {
            try {
                const res = await api.get(`/reviews/${id}`);
                if (res.data.success) {
                    setReviews(res.data.data || []);
                }
            } catch (error) {
                console.error("Lỗi khi lấy đánh giá:", error);
            }
        };

        fetchReviews();
        fetchBlockchainData();
    }, [id]);

    const addToCart = async () => {
        if (!localStorage.getItem('token')) {
            alert("Vui lòng đăng nhập để mua hàng!");
            navigate('/login');
            return;
        }
        try {
            await api.post('/cart/add', { product_id: product.id, quantity: 1 });
            alert("Đã thêm vào giỏ hàng!");
            window.dispatchEvent(new Event("cartUpdate"));
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi thêm giỏ hàng");
        }
    };

    if (isLoading || !product) {
        return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px' }}>⏳ Đang tải dữ liệu trực tiếp từ Blockchain...</p>;
    }

    // Tính điểm đánh giá trung bình
    const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
            <button onClick={() => navigate('/products')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '8px 15px', background: '#f0f0f0', border: 'none', borderRadius: '5px' }}>
                ← Quay lại cửa hàng
            </button>

            {/* THÔNG TIN CƠ BẢN */}
            <div style={{ display: 'flex', gap: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
                
                {/* CỘT ẢNH CÓ XỬ LÝ HẾT HÀNG */}
                <div style={{ position: 'relative', width: '300px', height: '300px', flexShrink: 0 }}>
                    <img 
                        src={product.image || "https://via.placeholder.com/300"} 
                        alt={product.name} 
                        style={{ 
                            width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px',
                            filter: product.stock <= 0 ? 'grayscale(100%)' : 'none',
                            opacity: product.stock <= 0 ? 0.8 : 1
                        }} 
                    />
                    {product.stock <= 0 && (
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            background: 'rgba(220, 53, 69, 0.9)', color: 'white', padding: '10px 20px',
                            fontWeight: 'bold', borderRadius: '5px', fontSize: '20px', letterSpacing: '1px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}>
                            HẾT HÀNG
                        </div>
                    )}
                </div>

                {/* CỘT THÔNG TIN */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 10px 0' }}>{product.name}</h2>
                    <div style={{ marginBottom: '15px', color: '#ffc107', fontWeight: 'bold', fontSize: '18px' }}> {/* đánh giá sao */}
                        {averageRating > 0 ? (
                            <>
                                {averageRating} ★ <span style={{ color: '#666', fontSize: '14px', fontWeight: 'normal' }}>({reviews.length} đánh giá)</span>
                            </>
                        ) : "Chưa có đánh giá"}
                    </div>
                    <p style={{ color: '#d9534f', fontSize: '24px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                        {Number(product.price).toLocaleString()} VNĐ
                    </p>
                    <p><strong>📍 Nguồn gốc:</strong> {product.origin}</p>
                    <p>
                        <strong>📦 Tình trạng kho:</strong>{' '}
                        {product.stock > 0 ? (
                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>Còn {product.stock} sản phẩm</span>
                        ) : (
                            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Đã hết hàng</span>
                        )}
                    </p>
                    <p style={{ lineHeight: '1.6' }}>{product.description}</p>
                    
                    {product.stock > 0 ? (
                        <button 
                            onClick={addToCart}
                            style={{ marginTop: '20px', padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                        >
                            🛒 Thêm vào giỏ hàng
                        </button>
                    ) : (
                        <div style={{ marginTop: '20px', padding: '15px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '5px', fontWeight: 'bold', display: 'inline-block' }}>
                            🚫 Sản phẩm hiện tại đang hết hàng. Vui lòng quay lại sau!
                        </div>
                    )}
                </div>
            </div>

            {/* ======================================================== */}
            {/* PHẦN HIỂN THỊ ĐÁNH GIÁ TỪ KHÁCH HÀNG */}
            {/* ======================================================== */}
            <div style={{ marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '30px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    💬 Đánh giá từ khách hàng ({reviews.length})
                </h3>

                {reviews.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>Sản phẩm này chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm!</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                        {reviews.map((rev, index) => (
                            <div key={index} style={{ padding: '20px', background: '#f9f9f9', borderRadius: '10px', border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div>
                                        <strong style={{ fontSize: '16px', color: '#333' }}>{rev.full_name}</strong>
                                        <div style={{ color: '#ffc107', fontSize: '18px', marginTop: '3px' }}>
                                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#999' }}>
                                        {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>
                                    {rev.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* TIMELINE LỊCH SỬ TỪ BLOCKCHAIN */}
            <div style={{ marginTop: '40px', padding: '25px', border: '1px solid #ddd', borderRadius: '10px', background: '#fff' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🔗 Hành trình sản phẩm</h3>
                <p style={{ color: '#28a745', fontSize: '14px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <strong>✓ Minh bạch tuyệt đối:</strong> Dữ liệu dưới đây được truy xuất trực tiếp từ sổ cái Blockchain.
                </p>

                {blockchainHistory.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>Sản phẩm này hiện chưa được ghi nhận dữ liệu lịch sử trên mạng lưới Blockchain.</p>
                ) : (
                    <div style={{ borderLeft: '3px solid #28a745', paddingLeft: '25px', marginLeft: '10px' }}>
                        {blockchainHistory.map((item, index) => {
                            // Parse JSON an toàn
                            let parsedData = {};
                            try {
                                parsedData = JSON.parse(item.note);
                            } catch (e) {
                                parsedData = { details: item.note };
                            }

                            return (
                                <div key={index} style={{ marginBottom: '30px', position: 'relative' }}>
                                    {/* Dấu chấm tròn Timeline */}
                                    <div style={{ position: 'absolute', left: '-34px', top: '2px', background: 'white', border: '4px solid #28a745', width: '14px', height: '14px', borderRadius: '50%' }}></div>
                                    
                                    <strong style={{ fontSize: '18px', color: '#111' }}>{item.stageName}</strong>
                                    <span style={{ marginLeft: '15px', fontSize: '14px', color: '#666', background: '#f1f3f5', padding: '3px 8px', borderRadius: '12px' }}>
                                        🕒 {new Date(item.timestamp).toLocaleString('vi-VN')}
                                    </span>
                                    
                                    {/* Hiển thị chi tiết Data ĐỘNG (Dynamic Rendering) */}
                                    <div style={{ marginTop: '10px', padding: '15px', background: '#f8fff9', borderRadius: '8px', border: '1px solid #c3e6cb', fontSize: '15px', color: '#333', lineHeight: '1.6' }}>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 15px', marginBottom: '8px' }}>
                                            {/* Tự động quét và in ra tất cả Key-Value trong JSON */}
                                            {Object.entries(parsedData).map(([key, value]) => {
                                                // Bỏ qua nếu dữ liệu là chữ "details" cũ (để tương thích ngược)
                                                if (key === 'details') return null;
                                                return (
                                                    <div style={{ display: 'contents' }} key={key}>
                                                        <strong style={{ color: '#28a745', display: 'flex', alignItems: 'center' }}>
                                                            <span style={{ marginRight: '5px' }}>▪</span> {key}:
                                                        </strong>
                                                        <span>{value}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {parsedData.details && (
                                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc' }}>
                                                <strong style={{ color: '#555' }}>📝 Ghi chú:</strong>
                                                <span style={{ marginLeft: '10px' }}>{parsedData.details}</span>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '12px', fontSize: '13px', color: '#888', fontStyle: 'italic', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                            Khắc lên Blockchain bởi tài khoản: {item.updatedBy}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;