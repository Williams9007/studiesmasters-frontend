import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaLaptop,
  FaChartLine,
  FaUsers,
  FaStar,
  FaPhoneAlt,
  FaWhatsapp,
  FaCalendarCheck,
  FaPlayCircle,
  FaCheck,
  FaRocket,
  FaClipboardList,
  FaGraduationCap,
  FaLinkedinIn,
} from "react-icons/fa";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


import ChatBotWidget from "./ChatBotWidget";

const contactNumber = "0545952096";
const whatsappNumber = "233545952096";

const packages = [
  {
    curriculum: "GES", title: "Main Subscriptions", color: "green", duration: "1 month",
    subjects: "English + Maths + Science",
    overview: "Flexible GES support plans for core subjects, homework help and exam preparation.",
    plans: [
      { name: "Starter Plan", price: "GH₵250.00", grades: "Basic 4-6, JHS 1-3, SHS 1-3", includes: ["👨‍🏫 Live group classes (10–15 students)", "📘 Maths + English + Science (core)", "📄 Weekly homework", "🧪 Monthly mini-test"] },
      { name: "Standard Plan", price: "GH₵500.00", grades: "Basic 4-6, JHS 1-3, SHS 1-3", includes: ["👨‍🏫 Smaller classes (4–8 students)", "📘 Maths + English + Science", "🧑‍🏫 Assigned tutor", "📊 Progress tracking (monthly report)", "🧩 Homework marking + feedback", "📞 Parent performance updates (monthly)"] },
      { name: "Premium Plan", price: "GH₵900.00", grades: "Basic 4-6, JHS 1-3, SHS 1-3", includes: ["👨‍🏫 2–3 student micro-group", "📘 Maths + English + Science", "📘 Intensive focus (BECE / WASSCE)", "📊 Weekly performance reports", "📝 Personal study plan"] },
    ],
  },
  {
    curriculum: "Cambridge", title: "Main Subscriptions", color: "blue", duration: "1 month",
    overview: "Cambridge-aligned tutoring for subject mastery, personalised coaching and exam preparation.",
    plans: [
      { name: "Starter Plan", price: "GH₵450.00", grades: "Grade 4-6", includes: ["👨‍🏫 Smaller classes (10–15 students)", "📘 3 sessions per week (Maths, basic Science & English)", "📊 60 mins per session", "📝 Homework + weekly quizzes included"] },
      { name: "Standard Plan", price: "GH₵760.00", grades: "Grade 7-9", includes: ["👨‍🏫 Smaller classes (5–10 students)", "📘 3 sessions per week (Maths, Science & English)", "📊 60 mins per session", "📝 Full Cambridge syllabus coverage (IGCSE)", "🧩 Monthly progress report", "📝 Past paper practice included"] },
      { name: "Premium Plan", price: "GH₵1,200.00", grades: "Grade 10-12", includes: ["👨‍🏫 Very small group: 2–3 students", "📚 3 sessions per week", "📊 60 mins per session", "📄 Intensive past-paper marking", "🎯 Weakness-focused tutoring"] },
    ],
  },
];

const programs = [
  {
    title: "GES",
    levels: "Primary 1 – 6 / JHS 1 – 3",
    description: "Build strong foundations in Maths, English and Science.",
    price: "GH₵300",
    color: "green",
    features: ["2–3 live classes per week", "Homework & worksheets", "Weekly quizzes", "Progress reports","Live group classes (10–15 students) "],
    icon: FaUserGraduate,
  },
  {
    title: "Cambridge Checkpoint",
    levels: "Years 7 – 9 (JHS 1 – 3)",
    description: "Targeted support for Checkpoint exams and beyond.",
    price: "GH₵450",
    color: "blue",
    popular: true,
    features: ["3–4 live classes per week", "Exam-style practice", "Monthly mock tests","Live group classes (10–15 students) ", "Detailed progress reports"],
    icon: FaBookOpen,
  },
  {
    title: "Cambridge SHS",
    levels: "Years 10 – 11 (SHS 1 – 2)",
    description: "Intensive preparation for top IGCSE results.",
    price: "GH₵1,200",
    color: "purple",
    features: ["4+ live classes per week", "Past paper mastery", "Exam strategies & marking", "Priority academic support"],
    icon: FaGraduationCap,
  },
];

const sliderSettings = {
  dots: true,
  arrows: false,
  infinite: true,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 4500,
  slidesToShow: 1,
  slidesToScroll: 1,
};

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const elem = document.getElementById(id);
    if (elem) elem.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-800 text-white text-xs sm:text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>📞 {contactNumber} | ✉️ info@studiesmasters.com</span>
          <span>📚 Online Learning Made Personal — Start Your Journey Today!</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">StudiesMasters</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => scrollToSection("pricing")} className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-indigo-700">Pricing</button>
            <button onClick={() => scrollToSection("testimonials")} className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-indigo-700">Testimonials</button>
            <button onClick={() => scrollToSection("contact")} className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-indigo-700">Contact</button>
            <button onClick={() => navigate("/register-course/student")} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-full shadow-lg shadow-indigo-200 transition">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left space-y-6">
          <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-bold px-4 py-1.5 rounded-full">🌟 Online Learning Made Personal</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
            Learn Live.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Excel Together.</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-xl">
            StudiesMasters connects you with expert tutors for engaging, real-time classes based on
            the <strong>GES</strong> and <strong>Cambridge (IGCSE / Checkpoint)</strong> curricula.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button onClick={() => navigate("/register-course/student")} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-full shadow-xl shadow-indigo-200 transition text-sm">
              🚀 Start Free Trial
            </button>
            <button onClick={() => scrollToSection("pricing")} className="w-full sm:w-auto bg-white border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-semibold px-8 py-3.5 rounded-full transition text-sm">
              View Plans
            </button>
          </div>
          <div className="flex items-center gap-6 text-gray-500 text-sm pt-4 justify-center lg:justify-start">
            <span>✅ 500+ Students</span>
            <span>✅ 50+ Tutors</span>
            <span>✅ 4.8 ★ Rating</span>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center shadow-2xl">
            <span className="text-7xl sm:text-8xl">📖</span>
            <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">Free Trial</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-indigo-50 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: "🎓", number: "500+", label: "Active Students" },
            { icon: "👨‍🏫", number: "50+", label: "Expert Tutors" },
            { icon: "📚", number: "2,000+", label: "Classes Held" },
            { icon: "⭐", number: "4.8", label: "Average Rating" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-extrabold text-gray-900">{s.number}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-bold px-4 py-1.5 rounded-full mb-4">📋 Our Programs</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Choose Your Learning Path</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Select your curriculum and join interactive classes tailored to your academic goals.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {programs.map((prog, i) => (
            <div key={i} className={`relative rounded-2xl p-6 border-2 transition hover:shadow-xl ${prog.popular ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"}`}>
              {prog.popular && <span className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">🔥 Most Popular</span>}
              <prog.icon className={`text-3xl mb-3 ${prog.color === "green" ? "text-green-600" : prog.color === "blue" ? "text-blue-600" : "text-purple-600"}`} />
              <h3 className="text-xl font-bold mb-1">{prog.title}</h3>
              <p className="text-sm text-gray-500 mb-1">{prog.levels}</p>
              <p className="text-sm text-gray-600 mb-3">{prog.description}</p>
              <p className="text-2xl font-extrabold text-gray-900 mb-4">{prog.price}<span className="text-sm font-normal text-gray-400">/month</span></p>
              <ul className="space-y-2 mb-6">
                {prog.features.map((f, j) => <li key={j} className="text-sm text-gray-600 flex items-start gap-2"><FaCheck className="text-green-500 mt-0.5 shrink-0" size={12} />{f}</li>)}
              </ul>
              <button onClick={() => navigate("/register-course/student")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">Enroll Now →</button>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Plans with emojis */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-bold px-4 py-1.5 rounded-full mb-4">💎 Detailed Plans</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Pick Your Perfect Plan</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Every plan includes live classes, homework support, and progress tracking.</p>
          </div>

          {packages.map((pkg, pi) => (
            <div key={pi} className="mb-12 last:mb-0">
              <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4 ${pkg.color === "green" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                {pkg.curriculum === "GES" ? "🇬🇭" : "🇬🇧"} {pkg.curriculum} — {pkg.title}
              </div>
              <p className="text-gray-500 text-sm mb-6 max-w-2xl">{pkg.overview}</p>

              <div className="grid md:grid-cols-3 gap-6">
                {pkg.plans.map((plan, j) => (
                  <div key={j} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition">
                    <h4 className="font-bold text-lg mb-1">{plan.name}</h4>
                    <p className="text-xs text-gray-400 uppercase mb-3">{plan.grades}</p>
                    <p className="text-3xl font-extrabold text-gray-900 mb-1">{plan.price}<span className="text-sm font-normal text-gray-400">/month</span></p>
                    <p className="text-xs text-gray-400 mb-4">Billed monthly · plan access for 1 month</p>
                    <p className="text-xs font-semibold text-gray-500 mb-3">What's included</p>
                    <ul className="space-y-2 mb-6">
                      {plan.includes.map((item, k) => <li key={k} className="text-sm text-gray-600">{item}</li>)}
                    </ul>
                    <button onClick={() => navigate("/register-course/student")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                      Get Started
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
        <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-bold px-4 py-1.5 rounded-full mb-4">🚀 How It Works</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-12">Your Learning Journey</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: "01", icon: "📝", title: "Sign Up Free", desc: "Create your account and tell us your curriculum and grade." },
            { step: "02", icon: "👨‍🏫", title: "Get Matched", desc: "We pair you with an expert tutor who fits your learning style." },
            { step: "03", icon: "📚", title: "Start Learning", desc: "Attend live classes, track your progress, and achieve more." },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition">
              <span className="text-4xl mb-4 block">{item.icon}</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">{item.step}</span>
              <h3 className="text-lg font-bold mt-3 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block bg-white/10 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4">💬 Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-12">What Parents & Students Say</h2>
          <Slider {...sliderSettings}>
            {[
              { name: "Ama S.", role: "Parent of JHS 2 Student", text: "My daughter's grades improved drastically after joining StudiesMasters. The tutors are patient and thorough!" },
              { name: "Kojo M.", role: "SHS 1 Student", text: "The small class sizes mean I get personal attention. I never felt confident in Maths until now." },
              { name: "Mrs. Owusu", role: "Parent of Year 9 Student", text: "The Cambridge program is excellent. My son passed his Checkpoint exams with flying colors." },
            ].map((t, i) => (
              <div key={i} className="px-4">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-white max-w-2xl mx-auto">
                  <p className="text-lg italic leading-relaxed mb-6">"{t.text}"</p>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-sm text-indigo-200">{t.role}</p>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">🎯 Ready to Get Started?</h2>
          <p className="text-indigo-100 max-w-xl mx-auto mb-8">Book a free trial class today and see the difference personalised learning makes.</p>
          <button onClick={() => navigate("/register-course/student")} className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8 py-3.5 rounded-full shadow-xl transition text-sm">
            🚀 Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <span className="text-2xl">📖</span>
            <span className="text-lg font-bold text-white ml-2">StudiesMasters</span>
            <p className="text-sm mt-2">Online learning made personal.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollToSection("pricing")} className="hover:text-white">Pricing</button></li>
              <li><button onClick={() => scrollToSection("testimonials")} className="hover:text-white">Testimonials</button></li>
              <li><button onClick={() => navigate("/register-course/student")} className="hover:text-white">Free Trial</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>📞 {contactNumber}</li>
              <li>✉️ info@studiesmasters.com</li>
              <li>📍 Accra, Ghana</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">Follow Us</h4>
            <div className="flex gap-4 text-xl">
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-white"><FaWhatsapp /></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white"><FaFacebookF /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white"><FaInstagram /></a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-white"><FaTiktok /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} StudiesMasters. All rights reserved.
        </div>
      </footer>

      <ChatBotWidget />
    </div>
  );
};

export default LandingPage;