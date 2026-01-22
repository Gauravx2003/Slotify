import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock,
  ChevronRight,
  ArrowLeft,
  Users,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Calendar as CalendarIconLucide,
  Download,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import type { SlotUpdate, SlotChange } from "../hooks/useSocket";
import { toast } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import CommentSection from "../components/CommentSection";


interface Resource {
  id: string;
  name: string;
  type: string;
}

interface Question {
  id: string;
  questionText: string;
  answerType: "single_line" | "multi_line" | "phone" | "radio" | "checkbox";
  options?: string | null;
  isMandatory: boolean;
  sortOrder: number;
}

interface AppointmentType {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  location: string | null;
  isPaid: boolean;
  bookingFeeCents: number | null;
  introMessage: string | null;
  confirmationMessage: string | null;
  manualConfirmation: boolean;
  manageCapacity: boolean;
  maxCapacity: number | null;
  imageUrl: string | null;
  resources: Resource[];
  questions: Question[];
}

interface Slot {
  startTime: string;
  endTime: string;
  available: boolean;
  remainingCapacity: number;
}

type BookingStep = "SLOT" | "QUESTIONS" | "CONFIRMED";



declare global {
  interface Window {
    Razorpay: any;
  }
}

const AppointmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { requireAuth, user } = useAuth();

  const [step, setStep] = useState<BookingStep>("SLOT");

  const [appointment, setAppointment] = useState<AppointmentType | null>(null);
  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Form states for booking
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    answers: {} as Record<string, string>,
  });

  // Booking confirmation details
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  // Slot hold ID for real-time reservation
  const [holdId, setHoldId] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  // Real-time socket connection for live slot updates
  // Use refs to access current values without useCallback dependency issues
  const selectedDateRef = useRef(selectedDate);
  const selectedSlotRef = useRef(selectedSlot);
  // Use isHolding ref to detect if we're the one booking (set BEFORE API call)
  const isHoldingRef = useRef(isHolding);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    selectedSlotRef.current = selectedSlot;
  }, [selectedSlot]);

  useEffect(() => {
    isHoldingRef.current = isHolding;
  }, [isHolding]);

  const handleSlotUpdate = useCallback((update: SlotUpdate) => {
    console.log('🔄 handleSlotUpdate called with:', {
      updateAppointmentId: update.appointmentTypeId,
      currentAppointmentId: id,
      updateDate: update.date,
      slotsCount: update.slots?.length,
    });

    // Only update if this is for our current appointment
    if (update.appointmentTypeId === id) {
      // Get current date from ref
      const currentDate = selectedDateRef.current;
      if (currentDate) {
        const currentDateStr = format(currentDate, "yyyy-MM-dd");
        console.log('📅 Date comparison:', { updateDate: update.date, currentDateStr, match: update.date === currentDateStr });

        if (update.date === currentDateStr) {
          console.log('✅ Updating slots state with', update.slots.length, 'slots');
          setSlots(update.slots);

          // If selected slot capacity changed, update it
          // But skip the "booked by someone else" warning if WE are the one booking
          const currentSelectedSlot = selectedSlotRef.current;
          const hasActiveHold = isHoldingRef.current;

          if (currentSelectedSlot && !hasActiveHold) {
            const updatedSlot = update.slots.find(
              s => s.startTime === currentSelectedSlot.startTime
            );
            if (updatedSlot) {
              if (updatedSlot.remainingCapacity === 0 && currentSelectedSlot.remainingCapacity > 0) {
                toast.error('This slot was just booked by someone else!');
                setSelectedSlot(null);
              } else {
                setSelectedSlot(updatedSlot);
              }
            }
          } else if (currentSelectedSlot && hasActiveHold) {
            // Just update the slot data without warning (we're the one booking)
            const updatedSlot = update.slots.find(
              s => s.startTime === currentSelectedSlot.startTime
            );
            if (updatedSlot) {
              setSelectedSlot(updatedSlot);
            }
          }
        } else {
          console.log('⏭️ Skipping update - date mismatch');
        }
      } else {
        console.log('⏭️ Skipping update - no date selected');
      }
    } else {
      console.log('⏭️ Skipping update - appointment ID mismatch');
    }
  }, [id]); // Only depend on id which is stable

  const handleSlotChange = useCallback((change: SlotChange) => {
    // Skip notifications if we're the one booking (have an active hold)
    const hasActiveHold = isHoldingRef.current;

    if (change.appointmentTypeId === id && !hasActiveHold) {
      const action = change.action;
      if (action === 'booked') {
        toast('Someone just booked a slot!', { icon: '👤' });
      } else if (action === 'cancelled' || action === 'payment_failed') {
        toast('A slot just became available!', { icon: '✨' });
      }
    }
  }, [id]);

  const { isConnected } = useSocket({
    appointmentTypeId: id,
    onSlotUpdate: handleSlotUpdate,
    onSlotChange: handleSlotChange,
  });

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  useEffect(() => {
    if (id && selectedDate && appointment) {
      fetchAvailability();
    }
  }, [id, selectedDate, appointment]);

  // Cleanup: Release slot hold when user navigates away from the page
  const holdIdRef = useRef(holdId);
  useEffect(() => {
    holdIdRef.current = holdId;
  }, [holdId]);

  useEffect(() => {
    // Handler for when user closes tab/window
    const handleBeforeUnload = () => {
      const currentHoldId = holdIdRef.current;
      if (currentHoldId) {
        console.log('🧹 beforeunload: Releasing slot hold');
        // Use navigator.sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(`/api/bookings/${currentHoldId}/release`);
      }
    };

    // Add event listener for tab/window close
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function runs when component unmounts (user navigates away within SPA)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      const currentHoldId = holdIdRef.current;
      if (currentHoldId) {
        console.log('🧹 Cleanup: Releasing slot hold on unmount');
        // Use fetch with keepalive to ensure request completes even during navigation
        fetch(`/api/bookings/${currentHoldId}/release`, {
          method: 'POST',
          keepalive: true, // Ensures request completes even if page unloads
        }).catch(err => console.error('Failed to release hold on cleanup:', err));
      }
    };
  }, []); // Empty deps - only run setup/cleanup once

  const fetchAppointment = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/appointments/public/${id}`);
      if (!response.ok) throw new Error("Appointment not found");
      const result = await response.json();
      setAppointment(result.data);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load appointment");
      setAppointment(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedDate) return;
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(
        `/api/appointments/public/${id}/availability?date=${dateStr}`
      );
      if (!response.ok) throw new Error("No slots available");
      const result = await response.json();
      setSlots(result.data?.slots || []);
    } catch (err) {
      setSlots([]);
    }
  };

  const handleNextFromSlot = async () => {
    if (!selectedSlot || !appointment) return;

    if (!requireAuth()) {
      return;
    }

    // Pre-fill customer info from authenticated user
    const customerEmail = user?.email || customerInfo.email;
    const customerName = user?.name || customerInfo.name;

    if (user && !customerInfo.name) {
      setCustomerInfo((prev) => ({
        ...prev,
        name: customerName,
        email: customerEmail,
      }));
    }

    // IMMEDIATELY hold the slot and broadcast to other users
    // Set ref directly (synchronous) AND state to ensure socket handlers see it immediately
    isHoldingRef.current = true;
    setIsHolding(true);
    try {
      const response = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appointmentTypeId: appointment.id,
          customerEmail: customerEmail || 'pending@temp.com',
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          numPeople: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to hold slot');
      }

      const result = await response.json();
      setHoldId(result.holdId);
      console.log('🔒 Slot held:', result.holdId);
      toast.success('Slot reserved! Complete your booking.');
      setStep('QUESTIONS');
    } catch (err: any) {
      console.error('Failed to hold slot:', err);
      toast.error(err.message || 'Failed to reserve slot. Please try again.');
      // Reset holding state on error
      isHoldingRef.current = false;
      setIsHolding(false);
      // Refresh slots to show current availability
      fetchAvailability();
    }
    // Note: Don't reset isHolding on success - we're still "holding" while in QUESTIONS step
  };

  const handleNextFromQuestions = () => {
    if (!customerInfo.name || !customerInfo.email) {
      alert("Please fill name and email");
      return;
    }
    const mandatoryQuestions =
      appointment?.questions.filter((q) => q.isMandatory) || [];
    for (const q of mandatoryQuestions) {
      const answer = customerInfo.answers[q.id];
      // Check if answer is empty, considering different answer types
      if (!answer || answer.trim() === "") {
        alert(`Question "${q.questionText}" is mandatory`);
        return;
      }
    }

    // For both paid and unpaid appointments, directly process the booking
    // For paid appointments, processBooking will open Razorpay directly
    processBooking();
  };

  const generateInvoice = () => {
    try {
      console.log('Generating invoice...');
      if (!appointment || !selectedSlot || !selectedDate) {
        console.error('Missing required data');
        toast.error('Cannot generate invoice - missing booking data');
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(219, 110, 52);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Slotify Booking Service', pageWidth / 2, 30, { align: 'center' });

      // Invoice Details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      let yPos = 55;

      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Number:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(bookingId || 'N/A', 70, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Date:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(format(new Date(), 'MMMM d, yyyy'), 70, yPos);

      yPos += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, yPos);

      yPos += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(customerInfo.name, 20, yPos);

      yPos += 5;
      doc.text(customerInfo.email, 20, yPos);

      if (customerInfo.phone) {
        yPos += 5;
        doc.text(customerInfo.phone, 20, yPos);
      }

      // Service Details Table
      yPos += 15;
      const tableData = [
        ['Service', appointment.title],
        ['Duration', `${appointment.durationMinutes} minutes`],
        ['Date', format(selectedDate, 'MMMM d, yyyy')],
        [
          'Time',
          new Date(selectedSlot.startTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        ],
        ['Location', appointment.location || 'Online Meeting'],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Details']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [219, 110, 52],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
      });

      // Payment Details
      const finalY = (doc as any).lastAutoTable.finalY + 20;

      if (appointment.isPaid && paidAmount !== null) {
        doc.setDrawColor(219, 110, 52);
        doc.setLineWidth(0.5);
        doc.line(130, finalY, pageWidth - 20, finalY);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Subtotal:', 130, finalY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`₹${paidAmount.toFixed(2)}`, pageWidth - 20, finalY + 7, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.text('Tax:', 130, finalY + 14);
        doc.setFont('helvetica', 'normal');
        doc.text('₹0.00', pageWidth - 20, finalY + 14, { align: 'right' });

        doc.setLineWidth(1);
        doc.line(130, finalY + 18, pageWidth - 20, finalY + 18);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Amount:', 130, finalY + 27);
        doc.text(`₹${paidAmount.toFixed(2)}`, pageWidth - 20, finalY + 27, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(34, 139, 34);
        doc.text('✓ PAID', pageWidth - 20, finalY + 34, { align: 'right' });
      } else {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Amount:', 130, finalY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text('FREE', pageWidth - 20, finalY + 7, { align: 'right' });
      }

      // Footer
      const footerY = doc.internal.pageSize.height - 20;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        'Thank you for booking with Slotify!',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.text(
        'For support, visit our website or contact us at support@slotify.com',
        pageWidth / 2,
        footerY + 5,
        { align: 'center' }
      );

      // Save the PDF
      const fileName = `invoice-${bookingId || 'booking'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      console.log('Saving PDF:', fileName);
      doc.save(fileName);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice. Please check the console for details.');
    }
  };

  /**
   * Release the slot hold when user cancels or navigates away
   */
  const releaseSlotHold = async () => {
    if (!holdId) return;

    try {
      await fetch(`/api/bookings/${holdId}/release`, {
        method: 'POST',
        credentials: 'include',
      });
      console.log('🔓 Slot released:', holdId);
      setHoldId(null);
    } catch (err) {
      console.error('Failed to release slot hold:', err);
    }
  };

  /**
   * Handle going back from questions step - releases the hold
   */
  const handleBackFromQuestions = async () => {
    await releaseSlotHold();
    // Reset holding state when going back
    isHoldingRef.current = false;
    setIsHolding(false);
    setHoldId(null);
    fetchAvailability(); // Refresh slots
    setStep('SLOT');
  };

  const processBooking = async () => {
    if (!appointment || !selectedSlot) return;

    setIsBooking(true);

    try {
      let bookingResult;

      // If we have a holdId, confirm it instead of creating a new booking
      if (holdId) {
        const response = await fetch(`/api/bookings/${holdId}/confirm-hold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone || undefined,
            subject: undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to confirm booking');
        }

        bookingResult = await response.json();
      } else {
        // Fallback: create a new booking if no hold exists (shouldn't happen normally)
        const answersArray = Object.entries(customerInfo.answers).map(
          ([questionId, answerText]) => ({
            questionId,
            answerText,
          })
        );

        const bookingData = {
          appointmentTypeId: appointment.id,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone || undefined,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          numPeople: 1,
          answers: answersArray.length > 0 ? answersArray : undefined,
        };

        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create booking");
        }

        bookingResult = await response.json();
      }

      // Store booking ID for invoice generation
      setBookingId(bookingResult.id);

      if (appointment.isPaid) {
        // Store the payment amount
        setPaidAmount(appointment.bookingFeeCents! / 100);

        try {
          // Fetch Razorpay Key
          const configRes = await fetch("/api/payments/config");
          const { key } = await configRes.json();

          if (!key) throw new Error("Payment configuration missing");

          // Create Order
          const orderRes = await fetch("/api/payments/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: bookingResult.id }),
          });

          if (!orderRes.ok) throw new Error("Failed to initiate payment");
          const order = await orderRes.json();

          const options = {
            key: key,
            amount: order.amount,
            currency: order.currency,
            name: "Slotify",
            description: `Booking: ${appointment.title}`,
            order_id: order.id,
            handler: async function (response: any) {
              try {
                const verifyRes = await fetch("/api/payments/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    bookingId: bookingResult.id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                });

                if (!verifyRes.ok)
                  throw new Error("Payment verification failed");

                toast.success("Booking confirmed!");
                setStep("CONFIRMED");
              } catch (err) {
                toast.error("Payment verification failed");
                console.error(err);
                // Release the slot on payment verification failure
                await fetch(`/api/bookings/${bookingResult.id}/payment-failed`, {
                  method: "POST",
                });
              }
            },
            prefill: {
              name: customerInfo.name,
              email: customerInfo.email,
              contact: customerInfo.phone,
            },
            theme: { color: "#db6e34" },
            modal: {
              ondismiss: async function () {
                // User closed the payment modal - release the slot
                console.log("Payment modal closed by user");
                toast("Payment cancelled - slot released", { icon: "ℹ️" });
                await fetch(`/api/bookings/${bookingResult.id}/payment-failed`, {
                  method: "POST",
                });
                // Refresh availability to show updated slots
                fetchAvailability();
              },
            },
          };

          const rzp = new window.Razorpay(options);

          // Handle payment failure
          rzp.on('payment.failed', async function (response: any) {
            console.error("Payment failed:", response.error);
            toast.error(`Payment failed: ${response.error.description}`);
            // Release the slot on payment failure
            await fetch(`/api/bookings/${bookingResult.id}/payment-failed`, {
              method: "POST",
            });
            // Refresh availability
            fetchAvailability();
          });

          rzp.open();
          setIsBooking(false);
          return;
        } catch (paymentError: any) {
          console.error("Payment setup error:", paymentError);
          toast.error("Failed to setup payment: " + paymentError.message);
          // Release the slot if payment setup fails
          if (bookingResult?.id) {
            await fetch(`/api/bookings/${bookingResult.id}/payment-failed`, {
              method: "POST",
            });
          }
          setIsBooking(false);
          return;
        }
      }

      toast.success("Booking created successfully!");
      setStep("CONFIRMED");
    } catch (error: any) {
      console.error("Booking error:", error);
      const errorMessage =
        error.message || "An error occurred while creating the booking";

      toast.error(errorMessage);

      // If it's a capacity error, refresh availability and clear selection
      if (
        errorMessage.toLowerCase().includes("fully booked") ||
        errorMessage.toLowerCase().includes("capacity")
      ) {
        setSelectedSlot(null);
        // Refresh availability to show updated capacities
        fetchAvailability();
      }
    } finally {
      if (!appointment?.isPaid) {
        setIsBooking(false);
      }
    }
  };

  const pageTransition = {
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  // Custom CSS for DayPicker to match the theme
  const css = `
    .rdp {
      --rdp-cell-size: 44px;
      --rdp-accent-color: #db6e34; /* rust-500 */
      --rdp-background-color: #fdf6ef; /* rust-50 */
      margin: 0;
    }
    .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
      background-color: var(--rdp-accent-color);
      color: white;
      font-weight: bold;
    }
    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
      background-color: var(--rdp-background-color);
      color: #6e2f20; /* rust-900 */
      font-weight: bold;
    }
    .rdp-head_cell {
      font-weight: 800;
      color: #94a3b8; /* surface-400 */
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
    }
    .rdp-caption_label {
      font-weight: 800;
      color: #0f172a; /* surface-900 */
      font-size: 1.125rem;
    }
    .rdp-nav_button {
      color: #db6e34; /* rust-500 */
    }
    .rdp-day {
      font-weight: 600;
    }
     .rdp-day_disabled {
      opacity: 0.25;
    }
  `;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rust-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loadError || !appointment) {
    return (
      <div className="min-h-screen bg-surface-50 text-surface-900">
        <Header />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 text-center">
          <h1 className="text-4xl font-extrabold text-surface-900 mb-4">
            Appointment Not Found
          </h1>
          <p className="text-xl text-surface-500 mb-8">
            {loadError || "The appointment you're looking for doesn't exist."}
          </p>
          <Link
            to="/appointments"
            className="inline-flex items-center px-8 py-3 bg-rust-600 text-white font-bold rounded-xl hover:bg-rust-700 transition-all shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Appointments
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 font-sans">
      <style>{css}</style>
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-48">
        <AnimatePresence mode="wait">
          {/* STEP 1: SLOT SELECTION */}
          {step === "SLOT" && (
            <motion.div
              key="slot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={pageTransition}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <Link
                    to="/appointments"
                    className="inline-flex items-center text-xs font-bold text-rust-600 hover:text-rust-800 mb-6 transition-colors uppercase tracking-widest"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
                  </Link>

                  {/* Appointment Image */}
                  {appointment.imageUrl && (
                    <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-surface-200">
                      <img
                        src={appointment.imageUrl}
                        alt={appointment.title}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}

                  <h1 className="text-4xl md:text-5xl font-extrabold text-surface-900 tracking-tight mb-4 leading-tight">
                    Book{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rust-600 to-rust-800">
                      {appointment.title}
                    </span>
                  </h1>
                  <p className="text-xl text-surface-500 font-medium leading-relaxed max-w-2xl">
                    {appointment.introMessage || appointment.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-surface-200 text-sm font-semibold text-surface-600 shadow-sm">
                    <Clock className="w-4 h-4 text-rust-500" />{" "}
                    {appointment.durationMinutes} Mins
                  </div>
                  <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-surface-200 text-sm font-semibold text-surface-600 shadow-sm">
                    <MapPin className="w-4 h-4 text-rust-500" />{" "}
                    {appointment.location || "Online"}
                  </div>
                  {appointment.isPaid && (
                    <div className="flex items-center gap-2 bg-rust-50 text-rust-700 px-5 py-3 rounded-2xl text-sm font-bold border border-rust-100 shadow-sm">
                      <CreditCard className="w-4 h-4" /> ₹
                      {appointment.bookingFeeCents! / 100}
                    </div>
                  )}
                </div>

                {/* Calendar Card */}
                <div className="bg-white rounded-3xl p-8 border border-surface-200 shadow-sm flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-surface-900">
                      <CalendarIconLucide className="w-5 h-5 text-rust-500" />{" "}
                      Select Date
                    </h2>
                    <div className="flex justify-center md:justify-start">
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }}
                        disabled={{ before: new Date() }}
                        showOutsideDays
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-64 bg-rust-50/50 rounded-2xl p-6 border border-rust-100/50 self-stretch flex flex-col justify-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-2">
                      Selected Date
                    </p>
                    {selectedDate ? (
                      <>
                        <p className="text-3xl font-black text-rust-600">
                          {format(selectedDate, "d")}
                        </p>
                        <p className="text-lg font-bold text-surface-900">
                          {format(selectedDate, "MMMM yyyy")}
                        </p>
                        <p className="text-sm font-bold text-surface-500">
                          {format(selectedDate, "EEEE")}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-surface-400 italic">
                        Please pick a date
                      </p>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <CommentSection appointmentTypeId={id!} />
              </div>

              {/* Slots Column */}
              <div className="h-fit lg:sticky lg:top-36 space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-surface-200 shadow-xl shadow-surface-200/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-surface-900">
                      Available Slots
                    </h2>
                    {/* Real-time connection indicator */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isConnected
                      ? 'bg-green-100 text-green-700'
                      : 'bg-surface-100 text-surface-500'
                      }`}>
                      {isConnected ? (
                        <>
                          <Wifi className="w-3 h-3" />
                          <span>Live</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3" />
                          <span>Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {!selectedDate ? (
                      <div className="col-span-2 text-center py-12 text-surface-400 text-sm font-medium">
                        Please select a date to view slots.
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="col-span-2 text-center py-12">
                        <div className="w-12 h-12 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-3 text-surface-300">
                          <Clock className="w-6 h-6" />
                        </div>
                        <p className="text-surface-600 font-bold">
                          No slots available
                        </p>
                        <p className="text-surface-400 text-xs mt-1">
                          Try selecting another date
                        </p>
                      </div>
                    ) : (
                      slots.map((slot) => {
                        const isSelected =
                          selectedSlot?.startTime === slot.startTime;
                        const isFull = slot.remainingCapacity === 0;
                        const hasLimitedCapacity =
                          appointment.manageCapacity && appointment.maxCapacity;
                        const totalCapacity = appointment.maxCapacity || 1;
                        const capacityPercentage = hasLimitedCapacity
                          ? (slot.remainingCapacity / totalCapacity) * 100
                          : 100;

                        return (
                          <button
                            key={slot.startTime}
                            disabled={!slot.available || isFull}
                            onClick={() => setSelectedSlot(slot)}
                            className={`relative py-3 px-2 rounded-xl text-sm font-bold border transition-all duration-200 ${isSelected
                              ? "bg-surface-900 text-white border-surface-900 shadow-md transform scale-[1.02]"
                              : isFull
                                ? "bg-surface-50 text-surface-300 border-surface-200 cursor-not-allowed opacity-50"
                                : !slot.available
                                  ? "bg-surface-50 text-surface-300 border-transparent cursor-not-allowed opacity-60"
                                  : "bg-white text-surface-700 border-surface-200 hover:border-rust-400 hover:text-rust-600 hover:shadow-sm"
                              }`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span>
                                {new Date(slot.startTime).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                              {hasLimitedCapacity && (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span
                                    className={`text-[10px] font-semibold ${isSelected
                                      ? "text-white/80"
                                      : isFull
                                        ? "text-red-500"
                                        : slot.remainingCapacity <= 3
                                          ? "text-orange-500"
                                          : "text-green-600"
                                      }`}
                                  >
                                    {isFull
                                      ? "Full"
                                      : `${slot.remainingCapacity}/${totalCapacity}`}
                                  </span>
                                  {/* Capacity indicator bar */}
                                  {!isFull && (
                                    <div className="w-full h-1 bg-surface-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-300 ${capacityPercentage > 30
                                          ? "bg-green-500"
                                          : capacityPercentage > 15
                                            ? "bg-orange-400"
                                            : "bg-red-400"
                                          }`}
                                        style={{
                                          width: `${capacityPercentage}%`,
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {isFull && (
                              <div className="absolute top-1 right-1">
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {selectedSlot &&
                    appointment.manageCapacity &&
                    appointment.maxCapacity && (
                      <div
                        className={`mb-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${!selectedSlot.available ||
                          selectedSlot.remainingCapacity === 0
                          ? "bg-red-50 border-red-200"
                          : selectedSlot.remainingCapacity <= 3
                            ? "bg-orange-50 border-orange-200"
                            : "bg-blue-50 border-blue-200"
                          }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${selectedSlot.remainingCapacity === 0
                              ? "bg-red-100"
                              : selectedSlot.remainingCapacity <= 3
                                ? "bg-orange-100"
                                : "bg-blue-100"
                              }`}
                          >
                            <Users
                              className={`w-5 h-5 ${selectedSlot.remainingCapacity === 0
                                ? "text-red-600"
                                : selectedSlot.remainingCapacity <= 3
                                  ? "text-orange-600"
                                  : "text-blue-600"
                                }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-bold text-sm ${selectedSlot.remainingCapacity === 0
                                ? "text-red-800"
                                : selectedSlot.remainingCapacity <= 3
                                  ? "text-orange-900"
                                  : "text-blue-900"
                                }`}
                            >
                              {selectedSlot.remainingCapacity === 0
                                ? "No spots remaining"
                                : selectedSlot.remainingCapacity === 1
                                  ? "Only 1 spot remaining!"
                                  : selectedSlot.remainingCapacity <= 3
                                    ? `Only ${selectedSlot.remainingCapacity} spots remaining!`
                                    : `${selectedSlot.remainingCapacity} spots available`}
                            </p>
                            <p
                              className={`text-xs mt-0.5 font-medium ${selectedSlot.remainingCapacity === 0
                                ? "text-red-700"
                                : selectedSlot.remainingCapacity <= 3
                                  ? "text-orange-800"
                                  : "text-blue-800"
                                }`}
                            >
                              Capacity: {selectedSlot.remainingCapacity}/
                              {appointment.maxCapacity} available
                            </p>
                          </div>
                        </div>
                        {/* Visual capacity bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span
                              className={
                                selectedSlot.remainingCapacity === 0
                                  ? "text-red-600"
                                  : selectedSlot.remainingCapacity <= 3
                                    ? "text-orange-600"
                                    : "text-blue-600"
                              }
                            >
                              {selectedSlot.remainingCapacity === 0
                                ? "Fully Booked"
                                : "Available"}
                            </span>
                            <span className="text-surface-400">
                              {Math.round(
                                (selectedSlot.remainingCapacity /
                                  appointment.maxCapacity) *
                                100
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${selectedSlot.remainingCapacity === 0
                                ? "bg-red-500"
                                : selectedSlot.remainingCapacity <= 3
                                  ? "bg-orange-500"
                                  : "bg-blue-500"
                                }`}
                              style={{
                                width: `${(selectedSlot.remainingCapacity /
                                  appointment.maxCapacity) *
                                  100
                                  }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  <button
                    disabled={!selectedSlot || isHolding}
                    onClick={handleNextFromSlot}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${selectedSlot && !isHolding
                      ? "bg-rust-600 text-white shadow-lg hover:bg-rust-700 hover:shadow-xl hover:translate-y-px"
                      : "bg-surface-100 text-surface-400 cursor-not-allowed"
                      }`}
                  >
                    {isHolding ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Reserving...
                      </>
                    ) : (
                      <>
                        Continue <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-xs text-surface-400 font-medium pb-8">
                    Powered by Slotify Secure Booking
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: QUESTIONS */}
          {/* STEP 2: QUESTIONS */}
          {step === "QUESTIONS" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={pageTransition}
              className="max-w-3xl mx-auto"
            >
              <button
                onClick={handleBackFromQuestions}
                className="group flex items-center gap-2 text-surface-500 font-bold hover:text-rust-600 mb-8 transition-colors text-sm uppercase tracking-wider pl-1"
              >
                <div className="p-2 bg-white rounded-full shadow-sm border border-surface-200 group-hover:border-rust-200 group-hover:bg-rust-50 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                Back to Slots
              </button>

              <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-surface-200 shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rust-50 to-transparent rounded-bl-full opacity-50 pointer-events-none" />

                {/* Header */}
                <div className="relative mb-12">
                  <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-rust-50 border border-rust-100 text-rust-700 text-xs font-bold uppercase tracking-wider">
                    <Users className="w-3 h-3" />
                    Step 2 of 2
                  </div>
                  <h2 className="text-4xl font-extrabold text-surface-900 leading-tight mb-3 tracking-tight">
                    Your Information
                  </h2>
                  <p className="text-lg text-surface-500 font-medium">
                    Please provide your details to finalize your booking for <span className="text-surface-900 font-bold">{appointment.title}</span>.
                  </p>
                </div>

                {/* Form Content */}
                <div className="space-y-10 relative">
                  {/* Personal Details Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-surface-100">
                      <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-surface-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-surface-900">
                        Personal Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 group">
                        <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 group-focus-within:text-rust-600 transition-colors ml-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className="w-full px-5 py-4 bg-surface-50 border border-surface-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-rust-500/10 focus:border-rust-500 outline-none transition-all font-bold text-surface-900 placeholder:text-surface-300 placeholder:font-medium"
                          value={customerInfo.name}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 group-focus-within:text-rust-600 transition-colors ml-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          className="w-full px-5 py-4 bg-surface-50 border border-surface-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-rust-500/10 focus:border-rust-500 outline-none transition-all font-bold text-surface-900 placeholder:text-surface-300 placeholder:font-medium"
                          value={customerInfo.email}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              email: e.target.value,
                            })
                          }
                          placeholder="e.g. john@example.com"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Additional Information Section */}
                  {appointment.questions.length > 0 && (
                    <section className="space-y-6 pt-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-surface-100">
                        <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-surface-600">
                          <span className="font-serif italic font-bold">i</span>
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-surface-900">
                          Additional Information
                        </h3>
                      </div>

                      <div className="space-y-8">
                        {appointment.questions.map((q) => (
                          <div key={q.id} className="space-y-3 bg-surface-50/50 p-6 rounded-3xl border border-surface-100/50 hover:border-surface-200 hover:bg-surface-50 transition-colors duration-300">
                            <label className="block text-sm font-bold text-surface-800 ml-1">
                              {q.questionText}{" "}
                              {q.isMandatory && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>

                            {/* Input Types */}
                            <div className="relative">
                              {q.answerType === "multi_line" && (
                                <textarea
                                  rows={3}
                                  className="w-full px-5 py-4 bg-white border border-surface-200 rounded-2xl focus:ring-4 focus:ring-rust-500/10 focus:border-rust-500 outline-none transition-all font-medium text-surface-900 resize-none shadow-sm"
                                  value={customerInfo.answers[q.id] || ""}
                                  onChange={(e) =>
                                    setCustomerInfo({
                                      ...customerInfo,
                                      answers: {
                                        ...customerInfo.answers,
                                        [q.id]: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="Type your answer here..."
                                />
                              )}

                              {q.answerType === "phone" && (
                                <div className="flex gap-3">
                                  <div className="relative w-28">
                                    <input
                                      type="text"
                                      placeholder="+91"
                                      maxLength={5}
                                      className="w-full px-4 py-4 bg-white border border-surface-200 rounded-2xl focus:ring-4 focus:ring-rust-500/10 focus:border-rust-500 outline-none transition-all font-bold text-center shadow-sm"
                                      value={(customerInfo.answers[q.id] || "").split("|")[0] || "+91"}
                                      onChange={(e) => {
                                        const code = e.target.value;
                                        const number = (customerInfo.answers[q.id] || "").split("|")[1] || "";
                                        setCustomerInfo({
                                          ...customerInfo,
                                          answers: {
                                            ...customerInfo.answers,
                                            [q.id]: `${code}|${number}`,
                                          },
                                        });
                                      }}
                                    />
                                  </div>
                                  <input
                                    type="tel"
                                    placeholder="1234567890"
                                    className="flex-1 px-5 py-4 bg-white border border-surface-200 rounded-2xl focus:ring-4 focus:ring-rust-500/10 focus:border-rust-500 outline-none transition-all font-bold text-surface-900 shadow-sm"
                                    value={(customerInfo.answers[q.id] || "").split("|")[1] || ""}
                                    onChange={(e) => {
                                      const code = (customerInfo.answers[q.id] || "").split("|")[0] || "+91";
                                      const number = e.target.value;
                                      setCustomerInfo({
                                        ...customerInfo,
                                        answers: {
                                          ...customerInfo.answers,
                                          [q.id]: `${code}|${number}`,
                                        },
                                      });
                                    }}
                                  />
                                </div>
                              )}

                              {q.answerType === "radio" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {(() => {
                                    if (!q.options) return <p className="text-amber-600 text-sm">No options available</p>;
                                    const options = q.options.includes("|||")
                                      ? q.options.split("|||")
                                      : q.options.split(",").map(o => o.trim());
                                    const filteredOptions = options.filter(opt => opt.trim() !== "");
                                    return filteredOptions.map((option, optIdx) => {
                                      const trimmedOption = option.trim();
                                      const isSelected = customerInfo.answers[q.id] === trimmedOption;
                                      return (
                                        <label
                                          key={optIdx}
                                          className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                                              ? "bg-rust-50 border-rust-500 shadow-sm"
                                              : "bg-white border-surface-200 hover:border-rust-300 hover:bg-surface-50"
                                            }`}
                                        >
                                          <input
                                            type="radio"
                                            className="peer sr-only"
                                            name={`question-${q.id}`}
                                            value={trimmedOption}
                                            checked={isSelected}
                                            onChange={(e) =>
                                              setCustomerInfo({
                                                ...customerInfo,
                                                answers: {
                                                  ...customerInfo.answers,
                                                  [q.id]: e.target.value,
                                                },
                                              })
                                            }
                                          />
                                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-rust-500' : 'border-surface-300'}`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-rust-500" />}
                                          </div>
                                          <span className={`font-bold ${isSelected ? 'text-rust-900' : 'text-surface-600'}`}>
                                            {trimmedOption}
                                          </span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              )}

                              {q.answerType === "checkbox" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {(() => {
                                    if (!q.options) return <p className="text-amber-600 text-sm">No options available</p>;
                                    const options = q.options.includes("|||")
                                      ? q.options.split("|||")
                                      : q.options.split(",").map(o => o.trim());
                                    const filteredOptions = options.filter(opt => opt.trim() !== "");
                                    const currentAnswers = (customerInfo.answers[q.id] || "").split("|||").filter(a => a.trim() !== "");

                                    return filteredOptions.map((option, optIdx) => {
                                      const trimmedOption = option.trim();
                                      const isChecked = currentAnswers.includes(trimmedOption);
                                      return (
                                        <label
                                          key={optIdx}
                                          className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isChecked
                                              ? "bg-rust-50 border-rust-500 shadow-sm"
                                              : "bg-white border-surface-200 hover:border-rust-300 hover:bg-surface-50"
                                            }`}
                                        >
                                          <input
                                            type="checkbox"
                                            className="sr-only"
                                            value={trimmedOption}
                                            checked={isChecked}
                                            onChange={(e) => {
                                              let newAnswers: string[];
                                              if (e.target.checked) {
                                                newAnswers = [...currentAnswers, trimmedOption];
                                              } else {
                                                newAnswers = currentAnswers.filter(a => a !== trimmedOption);
                                              }
                                              setCustomerInfo({
                                                ...customerInfo,
                                                answers: {
                                                  ...customerInfo.answers,
                                                  [q.id]: newAnswers.join("|||"),
                                                },
                                              });
                                            }}
                                          />
                                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isChecked ? 'border-rust-500 bg-rust-500' : 'border-surface-300 bg-white'}`}>
                                            {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                          </div>
                                          <span className={`font-bold ${isChecked ? 'text-rust-900' : 'text-surface-600'}`}>
                                            {trimmedOption}
                                          </span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              )}

                              {q.answerType === "single_line" && (
                                <input
                                  type="text"
                                  className="w-full px-5 py-4 bg-white border border-surface-200 rounded-2xl focus:ring-4 focus:ring-rust-500/10 focus:border-rust-500 outline-none transition-all font-medium text-surface-900 shadow-sm"
                                  value={customerInfo.answers[q.id] || ""}
                                  onChange={(e) =>
                                    setCustomerInfo({
                                      ...customerInfo,
                                      answers: {
                                        ...customerInfo.answers,
                                        [q.id]: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="Your answer"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="pt-8 mt-12 border-t border-surface-100">
                  <button
                    onClick={handleNextFromQuestions}
                    disabled={isBooking}
                    className="w-full py-5 bg-rust-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-rust-500/25 hover:bg-rust-700 hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isBooking ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing Booking...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Booking</span>
                        <ChevronRight className="w-6 h-6 stroke-[3px]" />
                      </>
                    )}
                  </button>
                  <div className="text-center mt-6 flex items-center justify-center gap-2 text-surface-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Secure SSL Connection</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CONFIRMED */}
          {step === "CONFIRMED" && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={pageTransition}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-3xl p-12 border border-surface-200 shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rust-400 to-rust-600"></div>

                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>

                <h1 className="text-4xl font-extrabold text-surface-900 tracking-tight mb-4">
                  Booking Confirmed!
                </h1>

                {appointment.isPaid && paidAmount !== null && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 inline-block">
                    <p className="text-sm font-bold text-green-800 uppercase tracking-wide mb-1">
                      Payment Successful
                    </p>
                    <p className="text-3xl font-extrabold text-green-600">
                      ₹{paidAmount.toFixed(2)}
                    </p>
                  </div>
                )}

                <p className="text-surface-500 text-lg mb-10">
                  Your appointment has been successfully scheduled. We've sent a
                  confirmation email to{" "}
                  <span className="font-bold text-surface-900">
                    {customerInfo.email}
                  </span>
                  .
                </p>

                <div className="bg-surface-50 rounded-2xl p-8 mb-10 text-left space-y-6 border border-surface-100">
                  <div className="flex justify-between items-start border-b border-surface-200 pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">
                        Service
                      </p>
                      <p className="text-lg font-bold text-surface-900">
                        {appointment.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">
                        Duration
                      </p>
                      <p className="text-lg font-bold text-surface-900">
                        {appointment.durationMinutes} min
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">
                        Date & Time
                      </p>
                      <p className="text-lg font-bold text-surface-900">
                        {selectedDate
                          ? format(selectedDate, "MMMM d, yyyy")
                          : ""}
                        <span className="mx-2">•</span>
                        {selectedSlot
                          ? new Date(selectedSlot.startTime).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">
                      Location
                    </p>
                    <p className="text-lg font-bold text-surface-900">
                      {appointment.location || "Online Meeting"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {bookingId && (
                    <button
                      onClick={generateInvoice}
                      className="w-full sm:w-auto px-8 py-3 bg-surface-900 text-white rounded-xl font-bold shadow-lg hover:bg-surface-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Invoice
                    </button>
                  )}
                  <Link
                    to="/appointments"
                    className="w-full sm:w-auto px-8 py-3 bg-rust-600 text-white rounded-xl font-bold shadow-lg hover:bg-rust-700 transition-colors"
                  >
                    Book Another
                  </Link>
                  <Link
                    to="/"
                    className="w-full sm:w-auto px-8 py-3 text-surface-600 font-bold hover:bg-surface-50 rounded-xl transition-colors"
                  >
                    Go Home
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default AppointmentDetails;
