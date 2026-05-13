import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        statusData: [],
        monthlyRevenue: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/orders/admin/dashboard/stats');
                setStats(res.data.data);
            } catch (error) {
                console.error("Lỗi tải dữ liệu thống kê:", error);
            }
        };
        fetchStats();
    }, []);

    // Cấu hình màu sắc cho biểu đồ tròn (khớp với màu trạng thái đơn hàng cũ)
    const STATUS_COLORS = {
        'pending': '#f0ad4e',     // Chờ xử lý: Vàng
        'processing': '#17a2b8',  // Đang chuẩn bị: Xanh ngọc
        'shipped': '#007bff',     // Đang giao: Xanh dương
        'delivered': '#28a745',   // Đã giao: Xanh lá
        'cancelled': '#dc3545'    // Đã hủy: Đỏ
    };

    const formatStatusName = (status) => {
        const map = { pending: 'Chờ xử lý', processing: 'Đang chuẩn bị', shipped: 'Đang giao', delivered: 'Thành công', cancelled: 'Đã hủy' };
        return map[status] || status;
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', color: '#333' }}>📊 Tổng quan kinh doanh</h2>

            {/* THẺ TÓM TẮT (SUMMARY CARDS) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #28a745' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '16px', fontWeight: 'bold' }}>💰 Tổng Doanh Thu (Đã nhận hàng)</p>
                    <h3 style={{ margin: 0, fontSize: '28px', color: '#28a745' }}>
                        {Number(stats.totalRevenue).toLocaleString()} VNĐ
                    </h3>
                </div>
                <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #007bff' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '16px', fontWeight: 'bold' }}>📦 Tổng Số Đơn Hàng</p>
                    <h3 style={{ margin: 0, fontSize: '28px', color: '#007bff' }}>
                        {stats.totalOrders} đơn
                    </h3>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px', marginTop: '40px' }}>
                
                {/* BIỂU ĐỒ CỘT: DOANH THU THEO THÁNG */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#555' }}>📈 Doanh thu 6 tháng gần nhất</h3>
                    {stats.monthlyRevenue.length > 0 ? (
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={stats.monthlyRevenue} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} VNĐ`} labelStyle={{ color: '#333' }} />
                                    <Legend />
                                    <Bar dataKey="revenue" name="Doanh thu" fill="#28a745" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Chưa có dữ liệu doanh thu</div>
                    )}
                </div>

                {/* BIỂU ĐỒ TRÒN: TRẠNG THÁI ĐƠN HÀNG */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#555' }}>🍩 Tỷ lệ trạng thái đơn hàng</h3>
                    {stats.statusData.length > 0 ? (
                        <div style={{ width: '100%', height: 350}}>
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={stats.statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="status"
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                            return (
                                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontWeight="bold" style={{ color: '#000000' }}>
                                                    {`${(percent * 100).toFixed(0)}%`}
                                                </text>
                                            );
                                        }}
                                    >
                                        {stats.statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, formatStatusName(name)]} />
                                    <Legend formatter={(value) => formatStatusName(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Chưa có đơn hàng nào</div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;