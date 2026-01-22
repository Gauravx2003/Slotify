import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Save,
  MapPin,
  Clock,
  Users,
  Camera,
  X,
  Upload,
  Plus,
  Trash2,
  Eye,
  Share2,
  Settings,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Package,
  LogOut,
  Calendar,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import CommentSection from "../../components/CommentSection";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { useAuth } from "../../hooks/useAuth";
import { logout as logoutAction } from "../../store/authSlice";
import api from "../../store/api";
import toast from "react-hot-toast";

type TabType = "schedule" | "questions" | "options" | "misc";

interface Schedule {
  id?: string;
  dayOfWeek: string;
  fromTime: string;
  toTime: string;
}

interface Resource {
  id: string;
  name: string;
  type: "user" | "resource";
  email?: string;
  capacity?: number | null;
}

interface Question {
  id?: string;
  questionText: string;
  answerType: "single_line" | "multi_line" | "phone" | "radio" | "checkbox";
  options?: string; // JSON string array for radio/checkbox options
  isMandatory: boolean;
  sortOrder: number;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const AppointmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const isEditMode = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LocalStorage key for draft state
  const DRAFT_KEY = 'appointment_form_draft';

  const [activeTab, setActiveTab] = useState<TabType>("schedule");
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // Helper function to load draft from localStorage
  const loadDraftFromStorage = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        return draft;
      }
    } catch (error) {
      console.error('Failed to load draft from localStorage:', error);
    }
    return null;
  };

  // Helper function to save draft to localStorage
  const saveDraftToStorage = (data: any) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save draft to localStorage:', error);
    }
  };

  // Helper function to clear draft from localStorage
  const clearDraftFromStorage = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error('Failed to clear draft from localStorage:', error);
    }
  };

  // Form State - Initialize from localStorage if available (only for new appointments)
  const [formData, setFormData] = useState(() => {
    if (!isEditMode) {
      const draft = loadDraftFromStorage();
      if (draft?.formData) {
        return draft.formData;
      }
    }
    return {
      title: "",
      description: "",
      durationMinutes: 30,
      location: "",
      assignmentType: "automatic" as "automatic" | "by_visitor",
      isPublished: false,
      isPaid: false,
      bookingFeeCents: 0,
      manageCapacity: false,
      maxCapacity: 1,
      manualConfirmation: false,
      cancellationHours: 1,
      slotCreationMode: "automatic" as "automatic" | "manual",
      introMessage: "",
      confirmationMessage: "",
    };
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    if (!isEditMode) {
      const draft = loadDraftFromStorage();
      if (draft?.schedules) {
        return draft.schedules;
      }
    }
    return [];
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>(() => {
    if (!isEditMode) {
      const draft = loadDraftFromStorage();
      if (draft?.selectedResources) {
        return draft.selectedResources;
      }
    }
    return [];
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (!isEditMode) {
      const draft = loadDraftFromStorage();
      if (draft?.questions) {
        return draft.questions;
      }
    }
    return [];
  });


  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(() => {
    if (!isEditMode) {
      const draft = loadDraftFromStorage();
      if (draft?.previewImageUrl) {
        return draft.previewImageUrl;
      }
    }
    return null;
  });

  const [showMeetingsModal, setShowMeetingsModal] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Save draft to localStorage whenever form state changes (only for new appointments)
  useEffect(() => {
    if (!isEditMode) {
      const draftData = {
        formData,
        schedules,
        selectedResources,
        questions,
        previewImageUrl: previewImage,
      };
      saveDraftToStorage(draftData);
    }
  }, [formData, schedules, selectedResources, questions, previewImage, isEditMode]);

  // Load appointment data or restore preview image
  useEffect(() => {
    if (isEditMode) {
      fetchAppointmentData();
    } else {
      // Restore preview image from draft
      const draft = loadDraftFromStorage();
      if (draft?.previewImageUrl) {
        setPreviewImage(draft.previewImageUrl);
      }
    }
    fetchResources();
  }, [id]);

  const fetchResources = async () => {
    try {
      const res = await api.get("/resources");
      if (res.data.success) {
        setResources(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load resources");
    }
  };

  const fetchAppointmentData = async () => {
    try {
      console.log('🔍 Fetching appointment data for ID:', id);

      const appRes = await api.get(`/appointments/${id}`);
      if (appRes.data.success) {
        const app = appRes.data.data;
        console.log('✅ Appointment data loaded:', app);
        setFormData({
          title: app.title || "",
          description: app.description || "",
          durationMinutes: app.durationMinutes || 30,
          location: app.location || "",
          assignmentType: app.assignmentType || "automatic",
          isPublished: app.isPublished || false,
          isPaid: app.isPaid || false,
          bookingFeeCents: app.bookingFeeCents || 0,
          manageCapacity: app.manageCapacity || false,
          maxCapacity: app.maxCapacity || 1,
          manualConfirmation: app.manualConfirmation || false,
          cancellationHours: app.cancellationHours || 1,
          slotCreationMode: app.slotCreationMode || "automatic",
          introMessage: app.introMessage || "",
          confirmationMessage: app.confirmationMessage || "",
        });
        // Load existing image if available
        if (app.imageUrl) {
          setExistingImageUrl(app.imageUrl);
          setPreviewImage(app.imageUrl);
        }
      }

      // Fetch schedules
      console.log('🔍 Fetching schedules...');
      const schedRes = await api.get(`/appointments/${id}/schedules`);
      console.log('📅 Schedules response:', schedRes.data);
      if (schedRes.data.success && schedRes.data.data?.schedules) {
        const fetchedSchedules = schedRes.data.data.schedules;
        console.log('✅ Setting schedules:', fetchedSchedules);
        setSchedules(fetchedSchedules);
      } else {
        console.log('⚠️ No schedules found');
        setSchedules([]);
      }

      // Fetch questions
      console.log('🔍 Fetching questions...');
      const questionsRes = await api.get(`/appointments/${id}/questions`);
      console.log('❓ Questions response:', questionsRes.data);
      if (questionsRes.data.success && Array.isArray(questionsRes.data.data)) {
        console.log('✅ Setting questions:', questionsRes.data.data);
        setQuestions(questionsRes.data.data);
      } else {
        console.log('⚠️ No questions found');
        setQuestions([]);
      }

      // Fetch linked resources
      console.log('🔍 Fetching linked resources...');
      const resourcesRes = await api.get(`/appointments/${id}/resources`);
      console.log('🔗 Resources response:', resourcesRes.data);
      if (resourcesRes.data.success && Array.isArray(resourcesRes.data.data)) {
        const resourceIds = resourcesRes.data.data.map((r: any) => r.id);
        console.log('✅ Setting selected resources:', resourceIds);
        setSelectedResources(resourceIds);
      } else {
        console.log('⚠️ No linked resources found');
        setSelectedResources([]);
      }
    } catch (error) {
      console.error('❌ Error fetching appointment data:', error);
      toast.error("Failed to load appointment data");
      navigate("/organizer/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!id) return;

    setIsLoadingBookings(true);
    try {
      const response = await api.get(`/bookings?appointmentTypeId=${id}`);
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let val: any;
    if (type === "checkbox") {
      val = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      // Parse number inputs as integers
      val = parseInt(value) || 0;
    } else {
      val = value;
    }

    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = async () => {
    // If there's an existing image on S3, delete it via API
    if (existingImageUrl && id) {
      try {
        await api.delete(`/appointments/${id}/image`);
        setExistingImageUrl(null);
        toast.success("Image removed");
      } catch (error) {
        console.error("Failed to delete image:", error);
        toast.error("Failed to delete image");
        return;
      }
    }

    setPreviewImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper function to sync schedules with the backend (for edit mode)
  const syncSchedules = async (appointmentId: string) => {
    try {
      // Get existing schedules from server
      const existingRes = await api.get(`/appointments/${appointmentId}/schedules`);
      const existingSchedules = existingRes.data.data?.schedules || [];

      // Determine which schedules to create, update, or delete
      const schedulesToCreate = schedules.filter(s => !s.id);
      const schedulesToUpdate = schedules.filter(s => s.id);
      const existingIds = new Set(schedulesToUpdate.map(s => s.id));
      const schedulesToDelete = existingSchedules.filter((s: Schedule) => !existingIds.has(s.id));

      // Delete removed schedules
      for (const schedule of schedulesToDelete) {
        await api.delete(`/schedules/${schedule.id}`);
      }

      // Update existing schedules
      for (const schedule of schedulesToUpdate) {
        await api.patch(`/schedules/${schedule.id}`, {
          dayOfWeek: schedule.dayOfWeek,
          fromTime: schedule.fromTime,
          toTime: schedule.toTime,
        });
      }

      // Create new schedules
      if (schedulesToCreate.length > 0) {
        await api.post(`/appointments/${appointmentId}/schedules`, {
          schedules: schedulesToCreate
        });
      }
    } catch (error) {
      console.error('Failed to sync schedules:', error);
      throw error;
    }
  };

  // Helper function to sync resources with the backend (for both new and edit mode)
  const syncResources = async (appointmentId: string) => {
    try {
      // Get existing linked resources
      const existingRes = await api.get(`/appointments/${appointmentId}/resources`);
      const existingResources = existingRes.data.data || [];
      const existingIds = new Set(existingResources.map((r: Resource) => r.id));
      const selectedIds = new Set(selectedResources);

      // Determine which resources to link/unlink
      const toLink = selectedResources.filter(id => !existingIds.has(id));
      const toUnlink = existingResources
        .filter((r: Resource) => !selectedIds.has(r.id))
        .map((r: Resource) => r.id);

      // Link new resources
      if (toLink.length > 0) {
        await api.post(`/appointments/${appointmentId}/resources`, {
          resourceIds: toLink
        });
      }

      // Unlink removed resources
      for (const resourceId of toUnlink) {
        await api.delete(`/appointments/${appointmentId}/resources/${resourceId}`);
      }
    } catch (error) {
      console.error('Failed to sync resources:', error);
      // If the endpoint doesn't exist yet, just log the error but don't throw
      if ((error as any)?.response?.status === 404) {
        console.warn('Resources endpoint not implemented yet');
      } else {
        throw error;
      }
    }
  };


  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter an appointment title");
      return;
    }

    setIsSaving(true);
    try {
      let appointmentId = id;

      // Ensure all numeric fields are numbers, not strings
      const payload = {
        ...formData,
        durationMinutes: parseInt(String(formData.durationMinutes)) || 30,
        bookingFeeCents: parseInt(String(formData.bookingFeeCents)) || 0,
        maxCapacity: parseInt(String(formData.maxCapacity)) || 1,
        cancellationHours: parseInt(String(formData.cancellationHours)) || 1,
      };

      if (isEditMode) {
        await api.patch(`/appointments/${id}`, payload);
      } else {
        const res = await api.post("/appointments", payload);
        appointmentId = res.data.data.id;
      }

      // Save schedules (for both new and edit mode)
      if (schedules.length > 0 && appointmentId) {
        // In edit mode, we need to sync schedules
        if (isEditMode) {
          await syncSchedules(appointmentId);
        } else {
          // For new appointments, just create all schedules
          await api.post(`/appointments/${appointmentId}/schedules`, { schedules });
        }
      }

      // Save selected resources (for both new and edit mode)
      if (selectedResources.length > 0 && appointmentId) {
        await syncResources(appointmentId);
      }

      // Upload image if present
      if (imageFile && appointmentId) {
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);
        const imageRes = await api.post(`/appointments/${appointmentId}/image`, imageFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // Update state with new image URL
        if (imageRes.data?.data?.imageUrl) {
          setExistingImageUrl(imageRes.data.data.imageUrl);
          setImageFile(null);
        }
      }

      toast.success(isEditMode ? "Appointment updated!" : "Appointment created!");

      // Clear draft from localStorage after successful save
      if (!isEditMode) {
        clearDraftFromStorage();
        navigate(`/organizer/appointments/${appointmentId}/edit`);
      }
    } catch (error) {
      toast.error("Failed to save appointment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter an appointment title");
      return;
    }

    setIsSaving(true);
    try {
      let appointmentId = id;
      let isNewAppointment = !isEditMode;

      // Ensure all numeric fields are numbers, not strings
      const payload = {
        ...formData,
        isPublished: false, // Save as draft
        durationMinutes: parseInt(String(formData.durationMinutes)) || 30,
        bookingFeeCents: parseInt(String(formData.bookingFeeCents)) || 0,
        maxCapacity: parseInt(String(formData.maxCapacity)) || 1,
        cancellationHours: parseInt(String(formData.cancellationHours)) || 1,
      };

      if (isEditMode) {
        await api.patch(`/appointments/${appointmentId}`, payload);
        setFormData((prev: any) => ({ ...prev, isPublished: false }));
      } else {
        const res = await api.post("/appointments", payload);
        appointmentId = res.data.data.id;
      }

      // Save schedules (for both new and edit mode)
      if (schedules.length > 0 && appointmentId) {
        if (isEditMode) {
          await syncSchedules(appointmentId);
        } else {
          await api.post(`/appointments/${appointmentId}/schedules`, { schedules });
        }
      }

      // Save selected resources (for both new and edit mode)
      if (selectedResources.length > 0 && appointmentId) {
        await syncResources(appointmentId);
      }

      // Save questions for NEW appointments (edit mode questions are already auto-saved)
      if (isNewAppointment && questions.length > 0 && appointmentId) {
        await api.post(`/appointments/${appointmentId}/questions`, { questions });
      }

      toast.success("Draft saved!");

      if (isNewAppointment) {
        // Clear draft from localStorage after successful save
        clearDraftFromStorage();
        navigate(`/organizer/appointments/${appointmentId}/edit`);
      }
    } catch (error) {
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter an appointment title");
      return;
    }

    setIsSaving(true);
    try {
      let appointmentId = id;
      let isNewAppointment = !isEditMode;
      const newPublishState = !formData.isPublished; // Toggle

      // Ensure all numeric fields are numbers, not strings
      const payload = {
        ...formData,
        isPublished: newPublishState,
        durationMinutes: parseInt(String(formData.durationMinutes)) || 30,
        bookingFeeCents: parseInt(String(formData.bookingFeeCents)) || 0,
        maxCapacity: parseInt(String(formData.maxCapacity)) || 1,
        cancellationHours: parseInt(String(formData.cancellationHours)) || 1,
      };

      console.log('🔍 FRONTEND: Payload being sent:', payload);
      console.log('🔍 FRONTEND: isPublished value:', payload.isPublished);

      let shareToken = "";

      if (isEditMode) {
        const res = await api.patch(`/appointments/${appointmentId}`, payload);
        shareToken = res.data.data.shareToken;
        setFormData((prev: any) => ({ ...prev, isPublished: newPublishState }));
      } else {
        const res = await api.post("/appointments", payload);
        appointmentId = res.data.data.id;
        shareToken = res.data.data.shareToken;
      }

      // Save schedules (for both new and edit mode)
      if (schedules.length > 0 && appointmentId) {
        if (isEditMode) {
          await syncSchedules(appointmentId);
        } else {
          await api.post(`/appointments/${appointmentId}/schedules`, { schedules });
        }
      }

      // Save selected resources (for both new and edit mode)
      if (selectedResources.length > 0 && appointmentId) {
        await syncResources(appointmentId);
      }

      // Save questions for NEW appointments (edit mode questions are already auto-saved)
      if (isNewAppointment && questions.length > 0 && appointmentId) {
        await api.post(`/appointments/${appointmentId}/questions`, { questions });
      }

      if (newPublishState) {
        // Publishing
        const shareUrl = `${window.location.origin}/appointments/${appointmentId}?token=${shareToken}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Published! Share link copied to clipboard");
      } else {
        // Unpublishing
        toast.success("Unpublished successfully");
      }

      if (isNewAppointment) {
        // Clear draft from localStorage after successful publish
        clearDraftFromStorage();
        navigate(`/organizer/appointments/${appointmentId}/edit`);
      }
    } catch (error) {
      toast.error("Failed to update appointment");
    } finally {
      setIsSaving(false);
    }
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      { dayOfWeek: "Monday", fromTime: "09:00", toTime: "17:00" },
    ]);
  };

  const removeSchedule = async (index: number) => {
    const sched = schedules[index];
    if (sched.id) {
      try {
        await api.delete(`/schedules/${sched.id}`);
      } catch (error) {
        toast.error("Failed to delete schedule");
        return;
      }
    }
    const newSchedules = [...schedules];
    newSchedules.splice(index, 1);
    setSchedules(newSchedules);
  };

  const updateSchedule = (index: number, field: keyof Schedule, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResources((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        answerType: "single_line",
        options: "",
        isMandatory: false,
        sortOrder: questions.length,
      },
    ]);
  };

  const removeQuestion = async (index: number) => {
    const question = questions[index];

    // If in edit mode and question has an ID, delete from server
    if (isEditMode && question.id) {
      try {
        await api.delete(`/appointments/${id}/questions/${question.id}`);
        toast.success("Question deleted");
      } catch (error) {
        console.error("Failed to delete question:", error);
        toast.error("Failed to delete question");
        return;
      }
    }

    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = async (
    index: number,
    field: keyof Question,
    value: string | boolean | number
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  // Save a single question update to the server (for edit mode)
  const saveQuestionToServer = async (index: number) => {
    const question = questions[index];
    if (!isEditMode || !question.id) return;

    try {
      await api.patch(`/appointments/${id}/questions/${question.id}`, {
        questionText: question.questionText,
        answerType: question.answerType,
        options: question.options || null,
        isMandatory: question.isMandatory,
        sortOrder: question.sortOrder,
      });
    } catch (error) {
      console.error("Failed to update question:", error);
      toast.error("Failed to save question");
    }
  };

  // Add a new question and save to server if in edit mode
  const addNewQuestionToServer = async () => {
    if (!isEditMode) {
      addQuestion();
      return;
    }

    // In edit mode, create the question on the server immediately
    const newQuestion = {
      questionText: "",
      answerType: "single_line" as const,
      options: "",
      isMandatory: false,
      sortOrder: questions.length,
    };

    try {
      const res = await api.post(`/appointments/${id}/questions`, {
        questions: [newQuestion]
      });
      if (res.data.success && res.data.data?.[0]) {
        setQuestions([...questions, res.data.data[0]]);
        toast.success("Question added");
      }
    } catch (error) {
      console.error("Failed to create question:", error);
      toast.error("Failed to add question");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rust-200 border-t-rust-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 font-sans pb-24">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-rust-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back & Actions */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("/organizer/dashboard")}
                className="p-2 rounded-xl hover:bg-rust-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600" />
              </button>

              <div className="h-6 w-px bg-rust-100"></div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAsDraft}
                  disabled={isSaving}
                  className="px-4 py-2 bg-surface-100 text-surface-600 rounded-xl text-sm font-bold hover:bg-surface-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isSaving}
                  className="px-4 py-2 rust-gradient text-white rounded-xl text-sm font-bold hover:shadow-lg shadow-rust-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {formData.isPublished ? 'Published' : 'Publish'}
                </button>
              </div>
            </div>

            {/* Right: User Info & Actions */}
            <div className="flex items-center gap-3">
              {/* User Name */}
              <div className="flex items-center gap-2 px-3 py-2 bg-rust-50 rounded-xl">
                <div className="w-8 h-8 bg-rust-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-sm font-bold text-surface-900">
                  {user?.name || "User"}
                </span>
              </div>

              {/* Meetings Button - Only in Edit Mode */}
              {isEditMode && (
                <button
                  onClick={() => {
                    fetchBookings();
                    setShowMeetingsModal(true);
                  }}
                  className="px-4 py-2 border border-rust-200 text-rust-600 rounded-xl text-sm font-bold hover:bg-rust-50 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Meetings
                </button>
              )}

              <button className="px-4 py-2 border border-rust-200 text-rust-600 rounded-xl text-sm font-bold hover:bg-rust-50 transition-colors"
                onClick={() => navigate('/organizer/reporting')}
              >
                Reporting
              </button>

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="px-4 py-2 border border-rust-200 text-rust-600 rounded-xl text-sm font-bold hover:bg-rust-50 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <AnimatePresence>
                  {showSettingsDropdown && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSettingsDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-rust-100 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <button
                          onClick={() => {
                            navigate('/organizer/users');
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-surface-700 hover:bg-rust-50 transition-colors flex items-center gap-3"
                        >
                          <Users className="w-4 h-4 text-rust-500" />
                          Users
                        </button>
                        <button
                          onClick={() => {
                            navigate('/organizer/resources');
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-surface-700 hover:bg-rust-50 transition-colors flex items-center gap-3"
                        >
                          <Package className="w-4 h-4 text-rust-500" />
                          Resources
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  dispatch(logoutAction());
                  toast.success("Logged out successfully");
                  navigate("/login");
                }}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Section */}
            <div className="bg-white border border-rust-100 rounded-3xl p-8 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-3">
                Appointment Title
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Dental care"
                className="w-full bg-transparent border-b-2 border-rust-200 text-3xl font-bold text-surface-900 placeholder-surface-300 outline-none focus:border-rust-500 transition-colors pb-2"
              />
            </div>

            {/* Duration & Location */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-rust-100 rounded-3xl p-6 shadow-sm">
                <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-3">
                  Duration
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleInputChange}
                    min="1"
                    className="w-24 bg-transparent border-b-2 border-rust-200 text-2xl font-bold text-surface-900 outline-none focus:border-rust-500 transition-colors"
                  />
                  <span className="text-surface-500 text-sm font-medium">Minutes</span>
                </div>
              </div>

              <div className="bg-white border border-rust-100 rounded-3xl p-6 shadow-sm">
                <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-3">
                  Location
                </label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Doctor's Office"
                  className="w-full bg-transparent border-b-2 border-rust-200 text-lg font-medium text-surface-900 placeholder-surface-300 outline-none focus:border-rust-500 transition-colors"
                />
              </div>
            </div>

            {/* Resource Assignment Section */}
            <div className="bg-white border border-rust-100 rounded-3xl p-8 shadow-sm">
              {/* User/Resource Selection with Checkboxes */}
              <div className="mb-6">
                <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-3">
                  Select Users & Resources
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resources.map((resource) => (
                    <label
                      key={resource.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedResources.includes(resource.id)
                        ? 'border-rust-500 bg-rust-50'
                        : 'border-rust-100 bg-surface-50 hover:border-rust-300'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedResources.includes(resource.id)}
                        onChange={() => toggleResourceSelection(resource.id)}
                        className="w-5 h-5 rounded accent-rust-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-surface-900">{resource.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${resource.type === 'user'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                            }`}>
                            {resource.type === 'user' ? 'USER' : 'RESOURCE'}
                          </span>
                        </div>
                        {resource.email && (
                          <span className="text-xs text-surface-500 block mt-1">{resource.email}</span>
                        )}
                      </div>
                      {resource.capacity && (
                        <span className="text-xs font-bold text-rust-600 bg-rust-100 px-2 py-1 rounded">
                          Cap: {resource.capacity}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {resources.length === 0 && (
                  <div className="text-center py-8 bg-surface-50 rounded-xl border-2 border-dashed border-rust-200">
                    <p className="text-sm text-surface-500 font-medium">
                      No users or resources available.
                      <button
                        onClick={() => navigate(`/organizer/users`)}
                        className="text-rust-600 font-bold hover:underline ml-1"
                      >
                        Create users
                      </button>
                      {' or '}
                      <button
                        onClick={() => navigate(`/organizer/resources`)}
                        className="text-rust-600 font-bold hover:underline"
                      >
                        create resources
                      </button>
                    </p>
                  </div>
                )}
              </div>

              {/* Assignment Type */}
              <div className="mb-6 p-5 bg-surface-50 rounded-2xl border border-rust-100">
                <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-3">
                  Assignment
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={formData.assignmentType === "automatic"}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, assignmentType: "automatic" }))
                      }
                      className="w-5 h-5 accent-rust-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-surface-900 block">Automatically</span>
                      <span className="text-xs text-surface-500">System assigns available user/resource</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={formData.assignmentType === "by_visitor"}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, assignmentType: "by_visitor" }))
                      }
                      className="w-5 h-5 accent-rust-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-surface-900 block">By visitor</span>
                      <span className="text-xs text-surface-500">Visitor chooses user/resource</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Manage Capacity */}
              <div className="p-5 bg-rust-50/50 rounded-2xl border border-rust-100">
                <label className="flex items-start gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    name="manageCapacity"
                    checked={formData.manageCapacity}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded accent-rust-500 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-surface-900">Manage capacity</span>
                      {formData.manageCapacity && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-rust-200">
                          <span className="text-xs font-medium text-surface-600">Allow</span>
                          <input
                            type="number"
                            name="maxCapacity"
                            value={formData.maxCapacity}
                            onChange={(e) => {
                              const value = Math.max(1, parseInt(e.target.value) || 1);
                              setFormData((prev) => ({ ...prev, maxCapacity: value }));
                            }}
                            min="1"
                            className="w-16 px-2 py-1 bg-surface-50 border border-rust-200 rounded text-center text-sm font-bold text-surface-900 outline-none focus:border-rust-500"
                          />
                          <span className="text-xs font-medium text-surface-600">simultaneous</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-surface-500 font-medium">
                      Limit the number of simultaneous appointments per user/resource
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white border border-rust-100 rounded-3xl overflow-hidden shadow-sm">
              {/* Tab Headers */}
              <div className="flex border-b border-rust-100">
                {(["schedule", "questions", "options", "misc"] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab
                      ? "text-rust-600 bg-rust-50/50"
                      : "text-surface-400 hover:text-surface-600 hover:bg-surface-50"
                      }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-rust-500 rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {activeTab === "schedule" && (
                    <motion.div
                      key="schedule"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-surface-900">Weekly Schedule</h3>
                          <p className="text-sm text-surface-500 font-medium">
                            Define your availability for this appointment type
                          </p>
                        </div>
                        <button
                          onClick={addSchedule}
                          className="px-6 py-3 rust-gradient text-white rounded-xl font-bold hover:shadow-lg shadow-rust-500/20 transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Time
                        </button>
                      </div>

                      {/* Schedule Header */}
                      <div className="grid grid-cols-12 gap-4 text-xs font-black uppercase tracking-widest text-rust-500 mb-2 px-2">
                        <div className="col-span-3">Every</div>
                        <div className="col-span-4 text-center">From</div>
                        <div className="col-span-4 text-center">To</div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Schedule Rows */}
                      {schedules.map((sched, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-4 items-center bg-surface-50 border border-rust-100 rounded-2xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="col-span-3">
                            <select
                              value={sched.dayOfWeek}
                              onChange={(e) => updateSchedule(idx, "dayOfWeek", e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-rust-100 rounded-xl font-bold text-sm text-surface-900 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all"
                            >
                              {DAYS_OF_WEEK.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-4 flex items-center justify-center gap-2">
                            <input
                              type="time"
                              value={sched.fromTime}
                              onChange={(e) => updateSchedule(idx, "fromTime", e.target.value)}
                              className="px-4 py-2 bg-white border border-rust-100 rounded-xl font-bold text-sm text-rust-600 text-center outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all"
                            />
                            <span className="text-rust-400 font-bold">→</span>
                          </div>
                          <div className="col-span-4 flex items-center justify-center">
                            <input
                              type="time"
                              value={sched.toTime}
                              onChange={(e) => updateSchedule(idx, "toTime", e.target.value)}
                              className="px-4 py-2 bg-white border border-rust-100 rounded-xl font-bold text-sm text-rust-600 text-center outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all"
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={() => removeSchedule(idx)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {schedules.length === 0 && (
                        <div className="text-center py-16 bg-rust-50/30 rounded-2xl border-2 border-dashed border-rust-200">
                          <Calendar className="w-16 h-16 mx-auto mb-4 text-rust-300" />
                          <p className="text-sm font-bold text-surface-600">No schedules added yet</p>
                          <p className="text-xs text-surface-400 mt-1">Click "Add Time" to create your first schedule</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "questions" && (
                    <motion.div
                      key="questions"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-surface-900">Custom Questions</h3>
                          <p className="text-sm text-surface-500 font-medium">
                            Collect additional information from visitors
                          </p>
                        </div>
                        <button
                          onClick={isEditMode ? addNewQuestionToServer : addQuestion}
                          className="px-6 py-3 rust-gradient text-white rounded-xl font-bold hover:shadow-lg shadow-rust-500/20 transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Question
                        </button>
                      </div>

                      {questions.map((question, idx) => (
                        <div
                          key={question.id || idx}
                          className="bg-surface-50 border border-rust-100 rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            <input
                              type="text"
                              value={question.questionText}
                              onChange={(e) =>
                                updateQuestion(idx, "questionText", e.target.value)
                              }
                              onBlur={() => isEditMode && question.id && saveQuestionToServer(idx)}
                              placeholder="Enter your question..."
                              className="flex-1 px-4 py-3 bg-white border border-rust-100 rounded-xl font-medium text-surface-900 placeholder-surface-300 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all"
                            />
                            <button
                              onClick={() => removeQuestion(idx)}
                              className="p-3 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <select
                              value={question.answerType}
                              onChange={(e) => {
                                const newAnswerType = e.target.value as Question["answerType"];
                                const newQuestions = [...questions];
                                const currentOptions = newQuestions[idx].options || "";

                                // When switching TO radio/checkbox and no options exist, initialize with empty option
                                let newOptions = currentOptions;
                                if ((newAnswerType === "radio" || newAnswerType === "checkbox") && !currentOptions) {
                                  newOptions = ""; // Will show one empty input field
                                }
                                // When switching AWAY from radio/checkbox, clear options
                                if (newAnswerType !== "radio" && newAnswerType !== "checkbox") {
                                  newOptions = "";
                                }

                                newQuestions[idx] = {
                                  ...newQuestions[idx],
                                  answerType: newAnswerType,
                                  options: newOptions
                                };
                                setQuestions(newQuestions);
                                // Save to server if in edit mode
                                if (isEditMode && question.id) {
                                  setTimeout(() => saveQuestionToServer(idx), 0);
                                }
                              }}
                              className="px-4 py-2 bg-white border border-rust-100 rounded-xl text-surface-700 text-sm font-bold outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10"
                            >
                              <option value="single_line">Single Line</option>
                              <option value="multi_line">Multi Line</option>
                              <option value="phone">Phone</option>
                              <option value="radio">Radio</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-white border border-rust-100 rounded-xl hover:bg-rust-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={question.isMandatory}
                                onChange={(e) => {
                                  updateQuestion(idx, "isMandatory", e.target.checked);
                                  // Save to server if in edit mode
                                  if (isEditMode && question.id) {
                                    setTimeout(() => saveQuestionToServer(idx), 0);
                                  }
                                }}
                                className="w-4 h-4 rounded accent-rust-500"
                              />
                              <span className="text-sm font-bold text-surface-700">Mandatory</span>
                            </label>
                          </div>
                          {/* Options input for radio and checkbox types */}
                          {(question.answerType === "radio" || question.answerType === "checkbox") && (
                            <div className="pt-2">
                              <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-3">
                                Options
                              </label>
                              <div className="space-y-2">
                                {(() => {
                                  // Parse options - support both ||| delimiter and legacy comma delimiter
                                  const optionsStr = question.options || "";
                                  let options: string[];
                                  if (optionsStr === "") {
                                    options = [""]; // Always show at least one input
                                  } else if (optionsStr.includes("|||")) {
                                    options = optionsStr.split("|||");
                                  } else {
                                    options = optionsStr.split(",").map(o => o.trim());
                                  }
                                  // Ensure at least one option slot exists
                                  if (options.length === 0) {
                                    options = [""];
                                  }

                                  return options.map((option, optIdx) => (
                                    <div key={`option-${idx}-${optIdx}`} className="flex items-center gap-2">
                                      <span className="w-6 h-6 flex items-center justify-center bg-rust-100 text-rust-600 rounded-lg text-xs font-bold">
                                        {optIdx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                          const newOptions = [...options];
                                          newOptions[optIdx] = e.target.value;
                                          // Filter out empty strings only when there are multiple options
                                          const finalOptions = newOptions.length > 1
                                            ? newOptions.filter((o, i) => o !== "" || i === optIdx)
                                            : newOptions;
                                          updateQuestion(idx, "options", finalOptions.join("|||"));
                                        }}
                                        onBlur={() => isEditMode && question.id && saveQuestionToServer(idx)}
                                        placeholder={`Option ${optIdx + 1}`}
                                        className="flex-1 px-4 py-2 bg-white border border-rust-100 rounded-xl font-medium text-surface-900 placeholder-surface-300 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all"
                                      />
                                      {options.length > 1 && (
                                        <button
                                          onClick={() => {
                                            const newOptions = options.filter((_, i) => i !== optIdx);
                                            updateQuestion(idx, "options", newOptions.join("|||"));
                                            if (isEditMode && question.id) {
                                              setTimeout(() => saveQuestionToServer(idx), 0);
                                            }
                                          }}
                                          className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                          title="Remove option"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  ));
                                })()}
                                {/* Add option button */}
                                <button
                                  onClick={() => {
                                    const optionsStr = question.options || "";
                                    let options: string[];
                                    if (optionsStr === "") {
                                      options = [];
                                    } else if (optionsStr.includes("|||")) {
                                      options = optionsStr.split("|||");
                                    } else {
                                      options = optionsStr.split(",").map(o => o.trim());
                                    }
                                    options.push("");
                                    updateQuestion(idx, "options", options.join("|||"));
                                    if (isEditMode && question.id) {
                                      setTimeout(() => saveQuestionToServer(idx), 0);
                                    }
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-rust-600 hover:bg-rust-50 rounded-xl transition-colors text-sm font-bold"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Option
                                </button>
                              </div>
                              <p className="text-xs text-surface-400 mt-2">
                                These will be shown as {question.answerType === "radio" ? "radio buttons (single choice)" : "checkboxes (multiple choice)"} to visitors.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}

                      {questions.length === 0 && (
                        <div className="text-center py-16 bg-rust-50/30 rounded-2xl border-2 border-dashed border-rust-200">
                          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-rust-300" />
                          <p className="text-sm font-bold text-surface-600">No questions added yet</p>
                          <p className="text-xs text-surface-400 mt-1">Click "Add Question" to create custom fields</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "options" && (
                    <motion.div
                      key="options"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-surface-900 mb-4">Payment Options</h3>
                        <label className="flex items-center justify-between gap-4 cursor-pointer p-6 bg-surface-50 border border-rust-100 rounded-2xl hover:bg-rust-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${formData.isPaid ? 'rust-gradient text-white' : 'bg-surface-200 text-surface-400'}`}>
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-surface-900 font-bold block">Paid Appointment</span>
                              <p className="text-xs text-surface-500 font-medium">
                                Require payment before booking
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {formData.isPaid && (
                              <div className="flex items-center gap-2">
                                <span className="text-surface-600 font-medium">₹</span>
                                <input
                                  type="number"
                                  name="bookingFeeRupees"
                                  value={formData.bookingFeeCents / 100}
                                  onChange={(e) => {
                                    const rupees = parseFloat(e.target.value) || 0;
                                    const cents = Math.round(rupees * 100);
                                    setFormData((prev) => ({ ...prev, bookingFeeCents: cents }));
                                  }}
                                  min="0"
                                  step="0.01"
                                  placeholder="Amount in Rupees"
                                  className="w-32 px-3 py-2 bg-white border border-rust-200 rounded-xl text-surface-900 text-sm font-medium outline-none focus:border-rust-500"
                                />
                              </div>
                            )}
                            <input
                              type="checkbox"
                              name="isPaid"
                              checked={formData.isPaid}
                              onChange={handleInputChange}
                              className="w-6 h-6 rounded-lg accent-rust-500"
                            />
                          </div>
                        </label>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-surface-900 mb-4">
                          Confirmation Settings
                        </h3>
                        <label className="flex items-center justify-between gap-4 cursor-pointer p-6 bg-surface-50 border border-rust-100 rounded-2xl hover:bg-rust-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${formData.manualConfirmation ? 'rust-gradient text-white' : 'bg-surface-200 text-surface-400'}`}>
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-surface-900 font-bold block">Manual Confirmation</span>
                              <p className="text-xs text-surface-500 font-medium">
                                Approve bookings manually before they're confirmed
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            name="manualConfirmation"
                            checked={formData.manualConfirmation}
                            onChange={handleInputChange}
                            className="w-6 h-6 rounded-lg accent-rust-500"
                          />
                        </label>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-surface-900 mb-4">
                          Cancellation Policy
                        </h3>
                        <div className="flex items-center gap-4 p-6 bg-surface-50 border border-rust-100 rounded-2xl">
                          <span className="text-surface-600 text-sm font-medium">Allow cancellation up to</span>
                          <input
                            type="number"
                            name="cancellationHours"
                            value={formData.cancellationHours}
                            onChange={handleInputChange}
                            min="0"
                            className="w-20 px-3 py-2 bg-white border border-rust-200 rounded-xl text-surface-900 text-center font-bold outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10"
                          />
                          <span className="text-surface-600 text-sm font-medium">hours before</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "misc" && (
                    <motion.div
                      key="misc"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-3">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Describe your appointment type..."
                          className="w-full px-5 py-4 bg-surface-50 border border-rust-100 rounded-2xl text-surface-900 placeholder-surface-300 font-medium outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-3">
                          Introduction Message
                        </label>
                        <textarea
                          name="introMessage"
                          value={formData.introMessage}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Message shown before booking..."
                          className="w-full px-5 py-4 bg-surface-50 border border-rust-100 rounded-2xl text-surface-900 placeholder-surface-300 font-medium outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-3">
                          Confirmation Message
                        </label>
                        <textarea
                          name="confirmationMessage"
                          value={formData.confirmationMessage}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Thank you message after booking..."
                          className="w-full px-5 py-4 bg-surface-50 border border-rust-100 rounded-2xl text-surface-900 placeholder-surface-300 font-medium outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all resize-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/* Discussion Section */}
            {isEditMode && (
              <div className="bg-white border border-rust-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="w-5 h-5 text-rust-500" />
                  <h3 className="text-xl font-bold text-surface-900">Discussion</h3>
                </div>
                {id && <CommentSection appointmentTypeId={id} />}
              </div>
            )}
          </div>

          {/* Right Column - Picture Upload */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-rust-100 rounded-3xl p-6 shadow-sm sticky top-24">
              <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-4">
                Picture
              </label>

              <div className="relative aspect-square bg-surface-50 border-2 border-dashed border-rust-200 rounded-2xl overflow-hidden group hover:border-rust-400 transition-colors">
                {previewImage ? (
                  <>
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rust-gradient rounded-xl hover:shadow-lg shadow-rust-500/20 transition-all"
                      >
                        <Upload className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={removeImage}
                        className="p-3 bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-rust-50/50 transition-colors"
                  >
                    <Camera className="w-16 h-16 text-rust-300" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-rust-600">Upload Image</p>
                      <p className="text-xs text-surface-400 mt-1">Max 5MB</p>
                    </div>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full mt-6 px-6 py-4 rust-gradient text-white rounded-2xl font-bold hover:shadow-xl shadow-rust-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? "Saving..." : "Save Appointment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <MeetingsModal
        isOpen={showMeetingsModal}
        onClose={() => setShowMeetingsModal(false)}
        bookings={bookings}
        isLoading={isLoadingBookings}
        appointmentTitle={formData.title}
        resources={resources}
        assignmentType={formData.assignmentType}
      />
    </div>
  );
};

export default AppointmentForm;

// Custom Status Dropdown Component
const StatusDropdown = ({
  currentStatus,
  bookingId,
  onStatusChange,
  disabled
}: {
  currentStatus: string;
  bookingId: string;
  onStatusChange: (bookingId: string, status: string) => void;
  disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: 'request', label: 'Request', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'booked', label: 'Booked', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
  ];

  const currentOption = statusOptions.find(opt => opt.value === currentStatus) || statusOptions[0];

  const handleSelect = (status: string) => {
    setIsOpen(false);
    if (status !== currentStatus) {
      onStatusChange(bookingId, status);
    }
  };

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border
          focus:outline-none focus:ring-2 focus:ring-rust-500/20 transition-all
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          flex items-center gap-1.5
          ${currentOption.color}
        `}
      >
        {currentOption.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Options */}
          <div className="absolute top-full left-0 mt-1 min-w-[120px] bg-white border border-surface-200 rounded-lg shadow-lg overflow-hidden z-20">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-3 py-2 text-xs font-bold uppercase tracking-wide text-left
                  transition-all hover:opacity-80 border-b last:border-b-0
                  ${option.color}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const MeetingsModal = ({
  isOpen,
  onClose,
  bookings,
  isLoading,
  appointmentTitle,
  resources,
  assignmentType,
}: {
  isOpen: boolean;
  onClose: () => void;
  bookings: any[];
  isLoading: boolean;
  appointmentTitle: string;
  resources: Resource[];
  assignmentType: string;
}) => {
  const [localBookings, setLocalBookings] = useState(bookings);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingResource, setUpdatingResource] = useState<string | null>(null);

  // Update local bookings when prop changes
  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  // Handle resource assignment
  const handleResourceAssignment = async (bookingId: string, resourceId: string | null) => {
    setUpdatingResource(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}`, {
        resourceId: resourceId,
      });

      // Update local state
      setLocalBookings((prev: any) =>
        prev.map((b: any) =>
          b.id === bookingId ? { ...b, resourceId: resourceId } : b
        )
      );

      toast.success('Resource assigned successfully');
    } catch (error) {
      console.error('Failed to assign resource:', error);
      toast.error('Failed to assign resource');
    } finally {
      setUpdatingResource(null);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });

      // Update local state
      setLocalBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
      );

      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      toast.error('Failed to update booking status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-200 bg-surface-50/50">
          <div>
            <h2 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
              Meetings
              <span className="px-3 py-1 bg-rust-100 text-rust-700 text-sm font-bold rounded-full">
                {localBookings.length}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search meetings..."
                className="pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-rust-500/20 focus:border-rust-500 transition-all w-64"
              />
              <Calendar className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-100/50 rounded-xl transition-colors text-surface-400 hover:text-surface-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-surface-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-surface-400">
              <div className="w-10 h-10 border-4 border-rust-500/30 border-t-rust-500 rounded-full animate-spin mb-4" />
              <p className="font-medium animate-pulse">Loading meetings...</p>
            </div>
          ) : localBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-surface-400">
              <div className="w-20 h-20 bg-surface-100 rounded-3xl flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-surface-300" />
              </div>
              <p className="text-lg font-bold text-surface-600">No meetings found</p>
              <p className="text-sm">Bookings will appear here once scheduled.</p>
            </div>
          ) : (
            <div className="bg-white border border-surface-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50/50 border-b border-surface-200">
                    {/* <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-surface-400">Subject</th> */}
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-surface-400">Appointment</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-surface-400">Booked By</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-surface-400">Resource</th>
                    {assignmentType === 'by_visitor' && (
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-surface-400">Assign</th>
                    )}
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-surface-400">Start</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-surface-400">End</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-surface-400">Capacity</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-surface-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {localBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-surface-50/50 transition-colors group">
                      {/* <td className="px-6 py-4 text-sm font-bold text-surface-900">
                        {booking.subject || 'No Subject'}
                      </td> */}
                      <td className="px-6 py-4 text-sm font-medium text-surface-600">
                        {appointmentTitle}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-surface-600">
                        {booking.customerName}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-surface-600">
                        {resources.find(r => r.id === booking.resourceId)?.name || '-'}
                      </td>
                      {assignmentType === 'by_visitor' && (
                        <td className="px-6 py-4">
                          <select
                            value={booking.resourceId || ''}
                            onChange={(e) => handleResourceAssignment(booking.id, e.target.value || null)}
                            disabled={updatingResource === booking.id}
                            className="px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-rust-500/20 focus:border-rust-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Unassigned</option>
                            {resources.map((resource) => (
                              <option key={resource.id} value={resource.id}>
                                {resource.name} ({resource.type})
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-surface-600 tabular-nums">
                        {formatDate(booking.startTime)}
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-600 tabular-nums">
                        {formatDate(booking.endTime)}
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-600">
                        {booking.numPeople || 1}
                      </td>
                      <td className="px-6 py-4">
                        <StatusDropdown
                          currentStatus={booking.status}
                          bookingId={booking.id}
                          onStatusChange={handleStatusChange}
                          disabled={updatingStatus === booking.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Discussion Section */}
        </div>
      </div>
    </div>
  );
};

