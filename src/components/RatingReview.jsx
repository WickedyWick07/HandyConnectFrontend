import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

const RatingReview = ({ onSubmit, providerName = 'this service provider' }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setMessage('Please select a star rating.');
      return;
    }
    if (!review.trim()) {
      setMessage('Please write a review before submitting.');
      return;
    }
    if (review.trim().length > 500) {
      setMessage('Your review must not exceed 500 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ rating, review: review.trim() });
      setReview('');
      setRating(0);
      setMessage('Your review has been submitted.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Rate {providerName}</h2>
      <p className="text-sm text-gray-600 mb-4">Share your experience to help other customers.</p>

      <form onSubmit={handleSubmit}>
        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-gray-700 mb-2">Your rating</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`Rate ${star} out of 5 stars`}
                aria-pressed={rating === star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <StarIcon
                  className={`h-8 w-8 ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mb-4">
          <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
            Your review
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => {
              setReview(e.target.value);
              setMessage('');
            }}
            maxLength={500}
            rows={4}
            placeholder="How was your experience with this provider?"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 text-right mt-1">{review.length}/500 characters</p>
        </div>

        {message && (
          <p role="status" aria-live="polite" className="text-sm text-blue-700 mb-4">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </section>
  );
};

export default RatingReview;