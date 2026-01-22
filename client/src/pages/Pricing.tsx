import { motion } from "framer-motion";
import { Check, Sparkles, TrendingUp, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Pricing = () => {
  const plans = [
    {
      id: 1,
      name: "Pay Per Booking",
      description: "Perfect for getting started with minimal commitment",
      price: "5%",
      period: "per booking",
      icon: <TrendingUp className="w-8 h-8" />,
      gradient: "from-rust-400 to-rust-600",
      features: [
        "No monthly subscription",
        "Pay only when you earn",
        "5% commission on each booking",
        "All core features included",
        "Email support",
        "Basic analytics dashboard",
        "Mobile app access",
      ],
      cta: "Start Free",
      highlighted: false,
    },
    {
      id: 2,
      name: "Professional",
      description: "Best value for growing businesses and professionals",
      price: "₹3,000",
      period: "per month",
      icon: <Crown className="w-8 h-8" />,
      gradient: "from-rust-500 to-rust-800",
      features: [
        "Only 0.5% booking commission",
        "Save up to 90% on fees",
        "Unlimited bookings",
        "Priority email & chat support",
        "Advanced analytics & reports",
        "Custom branding options",
        "API access",
        "Calendar integrations",
        "Resource management",
      ],
      cta: "Get Started",
      highlighted: true,
      badge: "Most Popular",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-surface-900">
      <Header />

      {/* Main Content - Compact Layout */}
      <section className="relative pt-24 pb-12 lg:pt-28 lg:pb-16 overflow-hidden px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-rust-50/50 to-transparent -z-10"></div>

        <div className="max-w-7xl mx-auto w-full">
          {/* Header Compact */}
          <div className="text-center mb-8 lg:mb-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-rust-100 mb-4"
            >
              <Sparkles className="w-3 h-3 text-rust-500 fill-rust-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-surface-900">
                Transparent Pricing
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-surface-900 mb-3 tracking-tight"
            >
              Simple Plans for <span className="text-gradient">Unknown Growth</span>
            </motion.h1>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className={`flex flex-col relative bg-white rounded-3xl p-6 shadow-lg border transition-all duration-300 ${plan.highlighted
                    ? "border-rust-500 shadow-rust-500/10 scale-[1.02] z-10"
                    : "border-surface-200 hover:border-rust-300"
                  }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-rust-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} text-white shadow-sm shrink-0`}
                  >
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 leading-none mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-surface-500 font-medium line-clamp-1">
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div className="mb-4 pb-4 border-b border-surface-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl lg:text-4xl font-black text-surface-900 tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-surface-400 font-bold text-[10px] uppercase tracking-wider">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-rust-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-surface-700 font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup/organizer"
                  className={`block text-center font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all shadow-sm active:scale-95 ${plan.highlighted
                      ? "rust-gradient text-white shadow-rust-500/20 hover:shadow-rust-500/30"
                      : "bg-surface-100 text-surface-900 hover:bg-surface-200"
                    }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-surface-500 font-medium">
              Questions? <Link to="/#contact" className="text-rust-600 hover:underline">Contact Sales</Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
