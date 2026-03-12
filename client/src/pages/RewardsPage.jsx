import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PointsBadge from '../components/PointsBadge';
import GiftCardCard from '../components/GiftCardCard';
import ConfirmModal from '../components/ConfirmModal';

function RewardsPage() {
  const { profile, refreshProfile } = useAuth();
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalCard, setModalCard] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const balance = profile?.pointsBalance ?? 0;

  useEffect(() => {
    apiClient.get('/api/gift-cards')
      .then((r) => setGiftCards(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load rewards'))
      .finally(() => setLoading(false));
  }, []);

  const handleRedeemClick = (card) => {
    setModalCard(card);
    setRedeemError(null);
  };

  const handleConfirmRedeem = async () => {
    if (!modalCard) return;
    setRedeemError(null);
    setRedeemLoading(true);
    try {
      const res = await apiClient.post('/api/redemptions', { giftCardId: modalCard.id });
      if (res.status === 200) {
        await refreshProfile();
        setModalCard(null);
        setSuccessMessage('Redemption successful!');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 422) {
        setRedeemError(msg || 'Not enough points.');
      } else {
        setRedeemError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (!redeemLoading) {
      setModalCard(null);
      setRedeemError(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-800/50 bg-red-950/20 px-4 py-3 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Rewards</h1>
      <div className="mb-6 flex items-center gap-4">
        <span className="text-slate-400">Your balance:</span>
        <PointsBadge points={balance} />
      </div>
      {successMessage && (
        <div className="mb-4 rounded-lg border border-emerald-800/50 bg-emerald-950/20 px-4 py-2 text-emerald-300 text-sm">
          {successMessage}
        </div>
      )}
      {loading ? (
        <div className="text-slate-400">Loading rewards...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {giftCards.map((card) => (
            <GiftCardCard
              key={card.id}
              id={card.id}
              brand={card.brand}
              pointCost={card.pointCost}
              pointsBalance={balance}
              onRedeem={handleRedeemClick}
            />
          ))}
        </div>
      )}
      <ConfirmModal
        open={!!modalCard}
        giftCard={modalCard}
        currentBalance={balance}
        onConfirm={handleConfirmRedeem}
        onCancel={handleCloseModal}
        loading={redeemLoading}
        error={redeemError}
      />
    </div>
  );
}

export default RewardsPage;
