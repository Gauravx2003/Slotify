import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle,
  FileText,
  Phone,
  Mail,
  Download,
  User,
} from "lucide-react";
import Header from "../../components/Header";
import { format } from "date-fns";
import api from "../../store/api";
import CommentSection from "../../components/CommentSection";
import toast from "react-hot-toast";



const BookingDetails = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/bookings/${id}`);
            const data = response.data.data;
            
            // Transform to match UI expectation
            const transformed = {
                id: data.id,
                service: data.appointmentType?.title || "Appointment",
                appointmentTypeId: data.appointmentTypeId, // Important for comments
                provider: data.resource?.name || "Unassigned",
                providerRole: "Provider", // dynamic role not yet available
                providerImage: "", // dynamic image not yet available
                date: new Date(data.startTime),
                duration: data.appointmentType?.durationMinutes || 60,
                status: data.status,
                location: data.appointmentType?.location || "Online",
                address: "", // Address not in current response
                price: data.payments?.amountCents ? data.payments.amountCents : (data.appointmentType?.bookingFeeCents || 0), 
                paymentStatus: data.payments?.paymentStatus || "unpaid",
                questions: [], // Questions/Answers fetching logic needed if specific endpoint exists or they are included in booking
                timeline: [], // Timeline logic to be implemented
            };
            
            setBooking(transformed);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load booking details");
        } finally {
            setIsLoading(false);
        }
    };
    fetchBooking();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-rust-200 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-rust-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
        <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-black text-surface-900 mb-2">Booking Not Found</h1>
            <Link to="/customer/bookings" className="text-rust-600 font-bold hover:underline">Return to Bookings</Link>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-surface-900 pb-20">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-32">
        {/* Back Button */}
        <Link 
            to="/customer/bookings" 
            className="inline-flex items-center gap-2 text-sm font-bold text-surface-500 hover:text-rust-600 mb-8 transition-colors"
        >
            <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
            <div>
                 <div className="flex items-center gap-3 mb-2">
                    <span className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                        {booking.status}
                    </span>
                    <span className="text-surface-400 font-bold text-sm">#{booking.id}</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-surface-900 tracking-tight leading-tight">
                    {booking.service}
                </h1>
            </div>
            
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-5 py-3 bg-white border border-surface-200 rounded-xl font-bold text-surface-700 hover:border-rust-500 hover:text-rust-600 transition-all shadow-sm">
                    <Download className="w-4 h-4" /> Invoice
                </button>
                <button className="flex items-center gap-2 px-5 py-3 bg-rust-600 text-white rounded-xl font-bold hover:bg-rust-700 transition-all shadow-lg hover:shadow-rust-500/20">
                    Reschedule
                </button>
            </div>
        </div>

        <div className="space-y-8">
            {/* Main Details Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-surface-100 overflow-hidden relative"
            >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div>
                        <h3 className="text-sm font-black text-surface-400 uppercase tracking-widest mb-4">Date & Time</h3>
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-rust-50 rounded-2xl flex items-center justify-center text-rust-600 flex-shrink-0">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xl font-black text-surface-900">{format(booking.date, 'MMMM d, yyyy')}</p>
                                <p className="text-lg font-medium text-surface-600">{format(booking.date, 'h:mm a')} - {format(new Date(booking.date.getTime() + booking.duration*60000), 'h:mm a')}</p>
                                <p className="text-sm font-bold text-surface-400 mt-1">{booking.duration} Minute Session</p>
                            </div>
                        </div>

                        <h3 className="text-sm font-black text-surface-400 uppercase tracking-widest mb-4">Location</h3>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-rust-50 rounded-2xl flex items-center justify-center text-rust-600 flex-shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xl font-black text-surface-900">{booking.location}</p>
                                <p className="text-surface-600 font-medium">{booking.address}</p>
                                <a href="#" className="text-rust-600 font-bold text-sm hover:underline mt-1 inline-block">Get Directions</a>
                            </div>
                        </div>
                    </div>

                    <div className="md:border-l md:border-surface-100 md:pl-8">
                         <h3 className="text-sm font-black text-surface-400 uppercase tracking-widest mb-4">Provider</h3>
                         <div className="flex items-center gap-4 mb-6">
                            {booking.providerImage ? (
                                <img src={booking.providerImage} alt={booking.provider} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center border-2 border-white shadow-md text-surface-400">
                                   {booking.provider && booking.provider !== 'Unassigned' ? (
                                       <span className="text-2xl font-black text-surface-600">{booking.provider.charAt(0).toUpperCase()}</span>
                                   ) : (
                                       <User className="w-8 h-8" />
                                   )}
                                </div>
                            )}
                            <div>
                                <p className="text-xl font-black text-surface-900">{booking.provider}</p>
                                <p className="text-surface-500 font-medium">{booking.providerRole}</p>
                                <div className="flex gap-2 mt-2">
                                    <button className="w-8 h-8 rounded-full bg-surface-50 flex items-center justify-center text-surface-600 hover:bg-rust-500 hover:text-white transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 rounded-full bg-surface-50 flex items-center justify-center text-surface-600 hover:bg-rust-500 hover:text-white transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                         </div>

                         <div className="p-4 bg-surface-50 rounded-2xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-surface-500">Total Price</span>
                                <span className="text-lg font-black text-surface-900">₹{booking.price / 100}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-green-600 uppercase tracking-wide">
                                <CheckCircle className="w-3 h-3" /> Payment {booking.paymentStatus}
                            </div>
                         </div>
                    </div>
                 </div>
            </motion.div>

            {/* Questions & Answers */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }} 
                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-surface-100"
            >
                <div className="flex items-center gap-3 mb-6">
                    <FileText className="w-6 h-6 text-rust-500" />
                    <h2 className="text-2xl font-black text-surface-900">Your Responses</h2>
                </div>
                <div className="space-y-6">
                    {booking.questions.map((q: any) => (
                        <div key={q.id} className="pb-6 border-b border-surface-50 last:border-0 last:pb-0">
                            <p className="text-sm font-bold text-surface-500 mb-2 uppercase tracking-wide">{q.question}</p>
                            <p className="text-lg font-medium text-surface-900">{q.answer}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Comment Section */}
            {booking.appointmentTypeId && (
                <CommentSection appointmentTypeId={booking.appointmentTypeId} />
            )}
        </div>
      </main>
    </div>
  );
};

export default BookingDetails;
