// ═══════════════════════════════════════════════════════════
// Reviews Section - Community Skill Reviews
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { theme } from '../styles/theme';
import {
  getSkillReviews,
  getSkillRatingStats,
  submitSkillReview,
  type SkillReview,
  type SkillReviewStats,
} from '../lib/supabase';

// ═══════════════════════════════════════════════════════════
// Star Rating Component
// ═══════════════════════════════════════════════════════════

function StarRating({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{
      display: 'flex',
      gap: '2px',
    }}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hovered ?? rating);
        return (
          <span
            key={star}
            onClick={() => interactive && onChange?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(null)}
            style={{
              fontSize: `${size}px`,
              cursor: interactive ? 'pointer' : 'default',
              color: filled ? '#fbbf24' : theme.colors.textSubtle,
              transition: theme.transitions.fast,
            }}
          >
            {filled ? '★' : '☆'}
          </span>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Review Card
// ═══════════════════════════════════════════════════════════

function ReviewCard({ review }: { review: SkillReview }) {
  const timeAgo = getTimeAgo(review.created_at);

  return (
    <div style={{
      padding: '12px',
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.md,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: theme.radius.full,
            background: theme.colors.bgElevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
          }}>
            👤
          </div>
          <span style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            fontWeight: theme.fontWeight.medium,
          }}>
            {review.user_name || 'Anonymous'}
          </span>
        </div>
        <StarRating rating={review.rating} size={12} />
      </div>
      <p style={{
        margin: 0,
        fontSize: theme.fontSize.sm,
        color: theme.colors.textPrimary,
        lineHeight: 1.4,
      }}>
        {review.comment}
      </p>
      <span style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
      }}>
        {timeAgo}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Review Form
// ═══════════════════════════════════════════════════════════

function ReviewForm({
  skillId,
  onSubmit,
  existingReview,
}: {
  skillId: string;
  onSubmit: (review: SkillReview) => void;
  existingReview?: SkillReview | null;
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a comment');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Mock user ID for demo
    const userId = 'demo-user-' + Math.random().toString(36).slice(2, 9);
    
    const result = await submitSkillReview(skillId, userId, rating, comment);

    setSubmitting(false);

    if (result.success && result.review) {
      onSubmit(result.review);
      setRating(0);
      setComment('');
    } else {
      setError(result.error || 'Failed to submit review');
    }
  };

  return (
    <div style={{
      padding: '12px',
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.md,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textPrimary,
      }}>
        {existingReview ? '✏️ Edit Your Review' : '✍️ Write a Review'}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
        }}>
          Rating:
        </span>
        <StarRating
          rating={rating}
          size={20}
          interactive
          onChange={setRating}
        />
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience with this skill..."
        rows={2}
        maxLength={200}
        style={{
          width: '100%',
          padding: '10px',
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          color: theme.colors.textPrimary,
          fontSize: theme.fontSize.sm,
          fontFamily: theme.fonts.sans,
          outline: 'none',
          resize: 'none',
        }}
      />

      {error && (
        <div style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.error,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          padding: '10px',
          background: submitting ? theme.colors.bgSecondary : theme.colors.textPrimary,
          border: 'none',
          borderRadius: theme.radius.md,
          color: submitting ? theme.colors.textMuted : theme.colors.bgPrimary,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          cursor: submitting ? 'not-allowed' : 'pointer',
          transition: theme.transitions.fast,
        }}
      >
        {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════

interface ReviewsSectionProps {
  skillId: string;
  skillName: string;
  compact?: boolean;
}

export default function ReviewsSection({
  skillId,
  skillName,
  compact = false,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<SkillReview[]>([]);
  const [stats, setStats] = useState<SkillReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      const [reviewsData, statsData] = await Promise.all([
        getSkillReviews(skillId, compact ? 3 : 10),
        getSkillRatingStats(skillId),
      ]);

      if (mounted) {
        setReviews(reviewsData);
        setStats(statsData);
        setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [skillId, compact]);

  const handleReviewSubmit = (review: SkillReview) => {
    setReviews(prev => [review, ...prev.filter(r => r.user_id !== review.user_id)]);
    setShowForm(false);
    // Update stats
    if (stats) {
      const newCount = stats.review_count + 1;
      const newAvg = ((stats.average_rating * stats.review_count) + review.rating) / newCount;
      setStats({
        ...stats,
        review_count: newCount,
        average_rating: parseFloat(newAvg.toFixed(1)),
      });
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: theme.colors.textMuted,
      }}>
        Loading reviews...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Header with Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            marginBottom: '4px',
          }}>
            ⭐ Community Reviews
          </div>
          {stats && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <StarRating rating={Math.round(stats.average_rating)} size={14} />
              <span style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.fontWeight.medium,
              }}>
                {stats.average_rating}
              </span>
              <span style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
              }}>
                ({stats.review_count} reviews)
              </span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '6px 10px',
            background: showForm ? theme.colors.bgElevated : 'transparent',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.full,
            color: theme.colors.textSecondary,
            fontSize: theme.fontSize.xs,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: theme.transitions.fast,
          }}
        >
          ✍️ {showForm ? 'Cancel' : 'Write Review'}
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          skillId={skillId}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {reviews.slice(0, compact ? 3 : reviews.length).map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
          
          {compact && reviews.length > 3 && (
            <button
              style={{
                padding: '8px',
                background: 'transparent',
                border: `1px dashed ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                color: theme.colors.textMuted,
                fontSize: theme.fontSize.xs,
                cursor: 'pointer',
              }}
            >
              View all {reviews.length} reviews →
            </button>
          )}
        </div>
      ) : (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: theme.colors.textMuted,
          background: theme.colors.bgTertiary,
          borderRadius: theme.radius.md,
          fontSize: theme.fontSize.sm,
        }}>
          No reviews yet. Be the first to review!
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Utility
// ═══════════════════════════════════════════════════════════

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

// Export stats getter for use in skill details
export { getSkillRatingStats, type SkillReviewStats };
