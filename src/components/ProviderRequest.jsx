import { useState, useEffect, useContext, useCallback } from "react";
import api from "../utils/api";
import AuthContext from "../context/AuthContext";
import ProviderHeader from "../components/ProviderHeader";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingPage from "./LoadingPage";

const ProviderRequest = () => {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const { fetchCurrentUser } = useContext(AuthContext);
  const [customer, setCustomer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reopeningId, setReopeningId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetchCurrentUser();
        setUser(res);
      } catch (error) {
        console.error("Error fetching user", error.stack);
        setLoading(false);
      }
    };
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only the first load shows the loading page; live refreshes update silently
  const getBookings = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.post("/fetch-provider-bookings", { user });
      setBookings(res.data.bookings || []);
      setCustomer(res.data.customers || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setBookings([]); // backend returns 404 when there are no bookings
      } else {
        console.error("There was an error fetching bookings", error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    getBookings();
  }, [getBookings]);

  // Refetch whenever a live notification arrives
  useEffect(() => {
    window.addEventListener("notification:new", getBookings);
    return () => window.removeEventListener("notification:new", getBookings);
  }, [getBookings]);

  const viewBooking = (booking) => {
    navigate("/view-booking", { state: { booking } });
  };

  // Put a completed / incomplete / declined job back to "accepted"
  const reopenBooking = async (booking) => {
    if (!window.confirm("Reopen this job and make it active again?")) return;
    setReopeningId(booking._id);
    try {
      await api.patch("/fetch-provider-bookings", {
        status: "accepted",
        bookingId: booking._id,
      });
      toast.success("Job reopened");
      await getBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not reopen the job");
    } finally {
      setReopeningId(null);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <ProviderHeader />

      {bookings.length === 0 ? (
        <p className="font-bold text-2xl sm:text-3xl lg:text-5xl text-gray-200 text-center py-10 px-4">
          No New Requests
        </p>
      ) : (
        <div className="p-4">
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full rounded min-w-[640px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border-r text-xs text-left text-gray-500">Client</th>
                  <th className="p-2 border-r text-xs text-left text-gray-500">Service</th>
                  <th className="p-2 border-r text-xs text-left text-gray-500">Location</th>
                  <th className="p-2 border-r text-xs text-left text-gray-500">Date</th>
                  <th className="p-2 border-r text-xs text-left text-gray-500">Status</th>
                  <th className="p-2 text-xs text-left text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const customerData =
                    customer.find((cust) => String(cust._id) === String(booking.user)) || {};
                  const canReopen = ["completed", "incomplete", "declined"].includes(booking.status);

                  return (
                    <tr key={booking._id}>
                      <td className="p-2 text-xs font-semibold text-center py-5 px-4">
                        {customerData.firstName} {customerData.lastName}
                      </td>
                      <td className="p-2 font-semibold text-xs">{booking.service}</td>
                      <td className="p-2 font-semibold text-xs">{booking.location}</td>
                      <td className="p-2 font-semibold text-xs">{booking.date}</td>
                      <td className="p-2 text-xs font-medium">
                        {booking.status === "accepted" || booking.status === "completed" ? (
                          <div className="text-xs text-center rounded-full bg-green-200 text-green-700 inline-block px-4 py-1">
                            {booking.status}
                          </div>
                        ) : booking.status === "declined" ? (
                          <div className="text-xs text-center rounded-full bg-red-200 text-red-700 inline-block px-4 py-1">
                            {booking.status}
                          </div>
                        ) : booking.status === "incomplete" ? (
                          <div className="text-xs text-center rounded-full bg-orange-200 text-orange-700 inline-block px-4 py-1">
                            {booking.status}
                          </div>
                        ) : (
                          <div className="text-xs text-center rounded-full bg-yellow-200 text-yellow-700 inline-block px-4 py-1">
                            {booking.status}
                          </div>
                        )}

                        {/* Reopen sits right under the status badge */}
                        {canReopen && (
                          <button
                            disabled={reopeningId === booking._id}
                            onClick={() => reopenBooking(booking)}
                            className="block mt-2 text-xs underline text-purple-700 disabled:opacity-50"
                          >
                            {reopeningId === booking._id ? "Reopening..." : "Reopen"}
                          </button>
                        )}
                      </td>
                      <td className="p-2 text-xs">
                        <button
                          onClick={() => viewBooking(booking)}
                          className="mx-auto text-center flex justify-center px-2"
                        >
                          <p className="text-xs p-2 m-2 font-medium text-center px-1 py-1 bg-purple-800 rounded text-white">
                            View Booking
                          </p>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderRequest;