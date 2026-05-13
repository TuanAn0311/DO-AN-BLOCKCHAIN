import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/toastContext';
import api from '../services/api';

const emptyAddress = {
  full_name: '',
  phone: '',
  address_line: '',
  district: '',
  city: '',
  is_default: 0,
};

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profile, setProfile] = useState({ email: '', full_name: '', phone: '', avatar: '' });
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const avatarText = useMemo(() => {
    return (profile.full_name || profile.email || 'U').trim().charAt(0).toUpperCase();
  }, [profile.email, profile.full_name]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, addressRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/addresses'),
        ]);

        setProfile({
          email: profileRes.data.data.email || '',
          full_name: profileRes.data.data.full_name || '',
          phone: profileRes.data.data.phone || '',
          avatar: profileRes.data.data.avatar || '',
        });
        setAddresses(addressRes.data.data || []);
      } catch (error) {
        if (error.response?.status === 401) {
          showToast('Vui lòng đăng nhập để xem hồ sơ.', 'warning');
          navigate('/login');
          return;
        }
        showToast('Không thể tải dữ liệu hồ sơ.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate, showToast]);

  const syncLocalUser = (user) => {
    const current = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...current, ...user }));
    window.dispatchEvent(new Event('cartUpdate'));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profile);
      syncLocalUser(res.data.data);
      showToast('Đã cập nhật hồ sơ.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể cập nhật hồ sơ.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm(emptyAddress);
    setEditingAddressId(null);
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();
    setIsSavingAddress(true);
    try {
      const payload = { ...addressForm, is_default: Number(addressForm.is_default) === 1 ? 1 : 0 };
      const res = editingAddressId
        ? await api.put(`/addresses/${editingAddressId}`, payload)
        : await api.post('/addresses', payload);

      setAddresses(res.data.data || []);
      resetAddressForm();
      showToast(editingAddressId ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể lưu địa chỉ.', 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const startEditAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      full_name: address.full_name || '',
      phone: address.phone || '',
      address_line: address.address_line || '',
      district: address.district || '',
      city: address.city || '',
      is_default: Number(address.is_default) === 1 ? 1 : 0,
    });
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await api.put(`/addresses/${id}/default`);
      setAddresses(res.data.data || []);
      showToast('Đã đặt địa chỉ mặc định.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể đặt mặc định.', 'error');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Xóa địa chỉ giao hàng này?')) return;

    try {
      const res = await api.delete(`/addresses/${id}`);
      setAddresses(res.data.data || []);
      if (editingAddressId === id) resetAddressForm();
      showToast('Đã xóa địa chỉ.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể xóa địa chỉ.', 'error');
    }
  };

  if (isLoading) {
    return <div className="loading-state">Đang tải hồ sơ...</div>;
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Tài khoản</div>
          <h1 className="page-title">Hồ sơ người dùng</h1>
          <p className="page-subtitle">
            Quản lý thông tin cá nhân và danh sách địa chỉ giao hàng dùng trong bước thanh toán.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <form className="panel" onSubmit={handleSaveProfile}>
          <div className="profile-card-head">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.full_name} className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">{avatarText}</div>
            )}
            <div>
              <h3>Thông tin cá nhân</h3>
              <p>Email, số điện thoại và ảnh đại diện của bạn.</p>
            </div>
          </div>

          <div className="profile-form-grid">
            <label>
              Họ và tên
              <input className="field" value={profile.full_name} onChange={(event) => setProfile((current) => ({ ...current, full_name: event.target.value }))} required />
            </label>
            <label>
              Email
              <input className="field" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} required />
            </label>
            <label>
              Số điện thoại
              <input className="field" value={profile.phone || ''} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              Link ảnh đại diện
              <input className="field" value={profile.avatar || ''} onChange={(event) => setProfile((current) => ({ ...current, avatar: event.target.value }))} placeholder="https://..." />
            </label>
          </div>

          <button className="btn btn-primary" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>
        </form>

        <div className="panel">
          <h3>{editingAddressId ? 'Sửa địa chỉ giao hàng' : 'Thêm địa chỉ giao hàng'}</h3>
          <form className="address-form" onSubmit={handleSaveAddress}>
            <input className="field" placeholder="Họ tên người nhận" value={addressForm.full_name} onChange={(event) => setAddressForm((current) => ({ ...current, full_name: event.target.value }))} required />
            <input className="field" placeholder="Số điện thoại" value={addressForm.phone} onChange={(event) => setAddressForm((current) => ({ ...current, phone: event.target.value }))} required />
            <input className="field" placeholder="Số nhà, tên đường" value={addressForm.address_line} onChange={(event) => setAddressForm((current) => ({ ...current, address_line: event.target.value }))} required />
            <div className="profile-form-grid">
              <input className="field" placeholder="Quận / Huyện" value={addressForm.district} onChange={(event) => setAddressForm((current) => ({ ...current, district: event.target.value }))} required />
              <input className="field" placeholder="Tỉnh / Thành phố" value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} required />
            </div>
            <label className="check-row">
              <input type="checkbox" checked={Number(addressForm.is_default) === 1} onChange={(event) => setAddressForm((current) => ({ ...current, is_default: event.target.checked ? 1 : 0 }))} />
              Đặt làm địa chỉ mặc định
            </label>
            <div className="form-actions">
              {editingAddressId && <button className="btn btn-secondary" type="button" onClick={resetAddressForm}>Hủy sửa</button>}
              <button className="btn btn-primary" type="submit" disabled={isSavingAddress}>
                {isSavingAddress ? 'Đang lưu...' : editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 22 }}>
        <div className="section-heading">
          <div>
            <h3>Địa chỉ giao hàng</h3>
            <p>Địa chỉ mặc định sẽ được ưu tiên chọn khi thanh toán.</p>
          </div>
          <span>{addresses.length} địa chỉ</span>
        </div>

        {addresses.length === 0 ? (
          <div className="empty-state card">Bạn chưa có địa chỉ giao hàng nào.</div>
        ) : (
          <div className="address-grid">
            {addresses.map((address) => (
              <article className="address-card" key={address.id}>
                <div className="address-card__top">
                  <strong>{address.full_name}</strong>
                  {Number(address.is_default) === 1 && <span>Mặc định</span>}
                </div>
                <p>{address.phone}</p>
                <p>{address.address_line}, {address.district}, {address.city}</p>
                <div className="address-card__actions">
                  {Number(address.is_default) !== 1 && <button className="btn btn-secondary" type="button" onClick={() => handleSetDefault(address.id)}>Đặt mặc định</button>}
                  <button className="btn btn-secondary" type="button" onClick={() => startEditAddress(address)}>Sửa</button>
                  <button className="btn btn-danger" type="button" onClick={() => handleDeleteAddress(address.id)}>Xóa</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile;
