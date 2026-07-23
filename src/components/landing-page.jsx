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
      { name: "Starter Plan", price: "GHâ‚µ250.00", grades: "Basic 4-6, JHS 1-3, SHS 1-3", includes: ["ðŸ‘©â€ðŸ« Live group classes (10â€“15 students)", "ðŸ“˜ Maths + English + Science (core)", "ðŸ“„ Weekly homework", "ðŸ§ª Monthly mini-test"] },
      { name: "Standard Plan", price: "GHâ‚µ500.00", grades: "Basic 4-6, JHS 1-3, SHS 1-3", includes: ["ðŸ‘©â€ðŸ« Smaller classes (4â€“8 students)", "ðŸ“˜ Maths + English + Science", "ðŸ§‘â€ðŸ« Assigned tutor", "ðŸ“Š Progress tracking (monthly report)", "ðŸ§  Homework marking + feedback", "ðŸ“ž Parent performance updates (monthly)"] },
      { name: "Premium Plan", price: "GHâ‚µ900.00", grades: "Basic 4-6, JHS 1-3, SHS 1-3", includes: ["ðŸ‘©â€ðŸ« 2â€“3 student micro-group", "ðŸ“˜ Maths + English + Science", "ðŸ“˜ Intensive focus (BECE / WASSCE)", "ðŸ“Š Weekly performance reports", "ðŸ“ Personal study plan"] },
    ],
  },
  {
    curriculum: "Cambridge", title: "Main Subscriptions", color: "blue", duration: "1 month",
    overview: "Cambridge-aligned tutoring for subject mastery, personalised coaching and exam preparation.",
    plans: [
      { name: "Starter Plan", price: "GHâ‚µ450.00", grades: "Grade 4-6", includes: ["ðŸ‘©â€ðŸ« Smaller classes (10â€“15 students)", "ðŸ“˜ 3 sessions per week (Maths, basic Science & English)", "ðŸ“Š 60 mins per session", "ðŸ“ Homework + weekly quizzes included"] },
      { name: "Standard Plan", price: "GHâ‚µ760.00", grades: "Grade 7-9", includes: ["ðŸ‘©â€ðŸ« Smaller classes (5â€“10 students)", "ðŸ“˜ 3 sessions per week (Maths, Science & English)", "ðŸ“Š 60 mins per session", "ðŸ“ Full Cambridge syllabus coverage (IGCSE)", "ðŸ§  Monthly progress report", "ðŸ“ Past paper practice included"] },
      { name: "Premium Plan", price: "GHâ‚µ1,200.00", grades: "Grade 10-12", includes: ["ðŸ‘¨â€ðŸ« Very small group: 2â€“3 students", "ðŸ“š 3 sessions per week", "ðŸ“Š 60 mins per session", "ðŸ“„ Intensive past-paper marking", "ðŸŽ¯ Weakness-focused tutoring"] },
    ],
  },
];

const programs = [
  {
    title: "GES",
    levels: "Primary 1 â€“ 6 / JHS 1 â€“ 3",
    description: "Build strong foundations in Maths, English and Science.",
    price: "GHâ‚µ300",
    color: "green",
    features: ["2â€“3 live classes per week", "Homework & worksheets", "Weekly quizzes", "Progress reports","Live group classes (10â€“15 students) "],
    icon: FaUserGraduate,
  },
  {
    title: "Cambridge Checkpoint",
    levels: "Years 7 â€“ 9 (JHS 1 â€“ 3)",
    description: "Targeted support for Checkpoint exams and beyond.",
    price: "GHâ‚µ450",
    color: "blue",
    popular: true,
    features: ["3â€“4 live classes per week", "Exam-style practice", "Monthly mock tests","Live group classes (10â€“15 students) ", "Detailed progress reports"],
    icon: FaBookOpen,
  },
  {
    title: "Cambridge SHS",
    levels: "Years 10 â€“ 11 (SHS 1 â€“ 2)",
    description: "Intensive preparation for top IGCSE results.",
    price: "GHâ‚µ1,200",
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

  const handleLoginClick = () => {
    navigate("/login");
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const testimonials = [
    {
      name: "Mrs. Mensah",
      message:
        "My son's Mathematics grade improved significantly within 3 months.",
    },
    {
      name: "Mr. Asare",
      message:
        "The platform is easy to use and teachers are highly professional.",
    },
    {
      name: "Mrs. Owusu",
      message:
        "Excellent support and detailed progress tracking for parents.",
    },
  ];


  return (
    <div className="bg-gray-50 min-h-screen">
      <ChatBotWidget />
      <div className="fixed bottom-3 left-3 z-50 flex max-w-[calc(100%-5.5rem)] flex-col gap-2 sm:bottom-4 sm:left-4 sm:max-w-xs">
        <a
          href={`tel:${contactNumber}`}
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xl ring-1 ring-slate-200 hover:bg-blue-50 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white sm:h-9 sm:w-9">
            <FaPhoneAlt />
          </span>
          <span className="truncate">
            Call {contactNumber}
          </span>
        </a>

        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-xl hover:bg-green-700 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-green-600 sm:h-9 sm:w-9">
            <FaWhatsapp />
          </span>
          <span className="truncate">
            WhatsApp {contactNumber}
          </span>
        </a>
      </div>

      {/* NAVBAR */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <FaBookOpen className="text-blue-600 text-xl sm:text-2xl" />
            <div>
              <h1 className="font-bold text-lg text-slate-900 sm:text-xl">
                StudiesMasters
              </h1>
              <p className="hidden text-xs text-gray-500 sm:block">
                Tracked Results, Real Impact!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-gray-700">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-gray-700 transition hover:text-blue-600"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("packages")}
              className="text-sm font-medium text-gray-700 transition hover:text-blue-600"
            >
              Programs
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("testimonials")}
              className="text-sm font-medium text-gray-700 transition hover:text-blue-600"
            >
              Reviews
            </button>
          </div>

          <button
            onClick={handleLoginClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm sm:px-5 sm:text-base"
          >
            Login
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-10 items-center sm:px-6 sm:py-20 lg:gap-12">
          <div>
            <span className="inline-block bg-blue-600 px-4 py-2 rounded-full text-xs font-semibold sm:text-sm">
              Ghana's Trusted Online Learning Platform
            </span>

            <h1 className="text-4xl md:text-6xl font-bold mt-6 leading-tight">
              Tracked Results.
              <br />
              Real Impact!
            </h1>

            <p className="text-slate-300 text-base mt-5 sm:text-lg sm:mt-6">
              Connecting students and teachers through engaging virtual
              learning. Access quality GES and Cambridge education from
              anywhere.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <button
                onClick={() => navigate("/register")}
                className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-semibold"
              >
                Get Started
              </button>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200"
              alt="Students"
              className="w-full rounded-2xl shadow-2xl sm:rounded-3xl"
            />

            <div className="absolute bottom-3 left-3 bg-white text-black p-4 rounded-xl shadow-xl sm:-bottom-6 sm:-left-6 sm:p-5">
              <h3 className="font-bold text-xl sm:text-2xl">500+</h3>
              <p className="text-sm sm:text-base">Students Learning</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          <StatCard icon={<FaUserGraduate />} number="500+" title="Students" />
          <StatCard icon={<FaChalkboardTeacher />} number="100+" title="Teachers" />
          <StatCard icon={<FaStar />} number="95%" title="Success Rate" />
          <StatCard icon={<FaLaptop />} number="24/7" title="Access" />
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="bg-white py-14 sm:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-10 sm:text-4xl sm:mb-12">
            Why Choose StudiesMasters?
          </h2>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            <FeatureCard
              icon={<FaLaptop />}
              title="Online Learning"
              text="Attend classes from anywhere."
            />

            <FeatureCard
              icon={<FaUsers />}
              title="Expert Teachers"
              text="Learn from experienced educators."
            />

            <FeatureCard
              icon={<FaChartLine />}
              title="Progress Tracking"
              text="Monitor performance and growth."
            />
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="packages" className="bg-gradient-to-r from-blue-50 to-cyan-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-2 text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            Choose Your Learning Package
          </h2>
          <p className="mb-10 text-center text-gray-600 sm:mb-12">
            Flexible monthly subscriptions for GES and Cambridge learners
          </p>
          <div className="mx-auto max-w-6xl space-y-12">
            {packages.map((group) => {
              const theme = group.color === "green"
                ? { heading: "text-green-700", border: "border-green-200", badge: "bg-green-600", soft: "bg-green-50" }
                : { heading: "text-blue-700", border: "border-blue-200", badge: "bg-blue-600", soft: "bg-blue-50" };
              return <div key={group.curriculum}>
                <div className="mb-5 text-center">
                  <p className={`text-sm font-bold uppercase tracking-[0.2em] ${theme.heading}`}>{group.curriculum}</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">{group.title}</h3>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">{group.overview}</p>
                  {group.subjects && <p className={`mx-auto mt-3 w-fit rounded-full px-4 py-2 text-sm font-semibold ${theme.soft} ${theme.heading}`}>Subjects: {group.subjects}</p>}
                </div>
                <div className="grid gap-5 md:grid-cols-3 md:gap-6">
                  {group.plans.map((plan) => <article key={`${group.curriculum}-${plan.name}`} className={`rounded-2xl border bg-white p-6 shadow-sm ${theme.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold text-white ${theme.badge}`}>{group.curriculum}</span>
                      <span className="text-right text-xs font-medium text-slate-500">Monthly access</span>
                    </div>
                    <h4 className={`mt-4 text-xl font-bold ${theme.heading}`}>{plan.name}</h4>
                    {plan.grades && <p className="mt-2 text-sm text-slate-600">{plan.grades}</p>}
                    {plan.price && <>
                      <p className={`mt-4 text-3xl font-black ${theme.heading}`}>{plan.price}<span className="ml-1 text-xs font-medium text-slate-600">/month</span></p>
                      <p className="mt-1 text-xs text-slate-500">Billed monthly Â· plan access for {group.duration}</p>
                    </>}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">What&apos;s included</p>
                    <ul className="mt-3 space-y-3 text-sm text-slate-700">
                      {plan.includes.map((item) => <li key={item} className="flex items-start gap-3"><FaCheck className={`mt-0.5 shrink-0 ${theme.heading}`} /><span>{item}</span></li>)}
                    </ul>
                    </div>
                  </article>)}
                </div>
              </div>;
            })}
          </div>

          <div className="mx-auto mt-7 flex max-w-6xl flex-col items-center gap-5 rounded-xl bg-amber-50 px-6 py-5 shadow-sm ring-1 ring-amber-100 md:flex-row">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-600"><FaRocket /></span>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-bold text-slate-900">Not sure which program is right for your child?</h3>
              <p className="mt-1 text-sm text-slate-700">Let us help you! Book a free trial class or assessment today.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate("/free-trial")} className="rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"><FaCalendarCheck className="mr-2 inline" />Book Free Trial Class</button>
              
            </div>
          </div>
        </div>
      </section>

      {/* LEARNING JOURNEY */}
      <section className="bg-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12 sm:text-4xl sm:mb-16">
            How It Works
          </h2>

          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <Step number="1" title="Register" />
            <Step number="2" title="Join Classes" />
            <Step number="3" title="Track Progress" />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        id="testimonials"
        className="bg-white py-14 sm:py-20"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-10 sm:text-4xl sm:mb-12">
            What Parents Say
          </h2>

          <Slider {...sliderSettings}>
            {testimonials.map((item) => (
              <div key={item.name} className="p-4">
                <div className="bg-gray-50 rounded-2xl p-6 shadow sm:p-8">
                  <div className="flex gap-1 text-yellow-500 mb-4">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                  </div>

                  <p className="italic text-gray-700">
                    "{item.message}"
                  </p>

                  <h4 className="font-bold mt-4">
                    {item.name}
                  </h4>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-10 pb-32 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 grid gap-8 sm:px-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <div>
            <h2 className="font-bold text-2xl">
              StudiesMasters
            </h2>
            <p className="text-gray-400 mt-3">
              Connecting students and teachers for meaningful learning.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">
              Policies
            </h3>
            <button onClick={() => navigate("/policies")} className="block text-left text-gray-400 hover:text-blue-400 mb-1">Terms & Conditions</button>
            <button onClick={() => navigate("/policies")} className="block text-left text-gray-400 hover:text-blue-400 mb-1">Privacy Policy</button>
            <button onClick={() => navigate("/policies")} className="block text-left text-gray-400 hover:text-blue-400">Parent Service Agreement</button>
          </div>

          <div>
            <h3 className="font-semibold mb-3">
              Quick Links
            </h3>
            <button onClick={() => navigate("/")} className="block text-left text-gray-400 hover:text-blue-400 mb-1">Home</button>
            <button onClick={() => { const el = document.getElementById("packages"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} className="block text-left text-gray-400 hover:text-blue-400 mb-1">Programs</button>
            <button onClick={() => { const el = document.getElementById("teachers"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} className="block text-left text-gray-400 hover:text-blue-400">Teachers</button>
          </div>

          <div>
            <h3 className="font-semibold mb-3">
              Contact
            </h3>
            <p>info@studiesmasters.com</p>
            
          </div>

          <div>
            <h3 className="font-semibold mb-3">
              Follow Us
            </h3>

            <div className="flex gap-4 text-xl">
              <a
                href="https://facebook.com/onlinestudies"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="StudiesMasters on Facebook"
                className="hover:text-blue-400"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://instagram.com/studiesmasters"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="StudiesMasters on Instagram"
                className="hover:text-pink-400"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.tiktok.com/@studiesmasters"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="StudiesMasters on TikTok"
                className="hover:text-purple-400"
              >
                <FaTiktok />
              </a>
              <a
                href={"https://linkedin.com/company/studiesmasters"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="StudiesMasters on LinkedIn"
                className="hover:text-blue-400"
              >
                <FaLinkedinIn />
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 mt-10">
          &copy; 2026 StudiesMasters. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

const StatCard = ({ icon, number, title }) => (
  <div className="bg-white rounded-xl shadow p-4 text-center sm:p-6">
    <div className="text-blue-600 text-2xl flex justify-center mb-3 sm:text-3xl">
      {icon}
    </div>
    <h3 className="text-2xl font-bold sm:text-3xl">{number}</h3>
    <p className="text-sm text-gray-600 sm:text-base">{title}</p>
  </div>
);

const FeatureCard = ({ icon, title, text }) => (
  <div className="bg-gray-50 rounded-2xl p-6 text-center shadow sm:p-8">
    <div className="text-blue-600 text-3xl flex justify-center mb-4 sm:text-4xl">
      {icon}
    </div>
    <h3 className="font-bold text-xl mb-2">{title}</h3>
    <p className="text-gray-600">{text}</p>
  </div>
);

const Step = ({ number, title }) => (
  <div>
    <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto sm:w-16 sm:h-16 sm:text-2xl">
      {number}
    </div>

    <h3 className="mt-4 font-bold">{title}</h3>
  </div>
);

const ActionCard = ({ icon, title, description, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition sm:p-6"
  >
    <div className="text-blue-600 text-3xl mb-4">
      {icon}
    </div>

    <h3 className="text-xl font-bold mb-2">
      {title}
    </h3>

    <p className="text-gray-600">
      {description}
    </p>
  </div>
);

export default LandingPage;
