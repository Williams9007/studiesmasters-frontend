import React, { useState } from "react";
import {
  FaChevronDown,
  FaComments,
  FaEnvelope,
  FaPaperPlane,
  FaTimes,
} from "react-icons/fa";

const supportEmail = "customersupport@studiesmasters.com";

const faqs = [
  {
    question: "What is StudiesMasters all about?",
    answer:
      "StudiesMasters connects students with qualified teachers for structured online classes across GES and Cambridge curricula.",
  },
  {
    question: "Who does StudiesMasters serve?",
    answer:
      "StudiesMasters serves parents or guardians aged 18 and over who want to register their children for online after-school classes. Parents are advised to supervise learning periods.",
  },
  {
    question: "What student age is appropriate to register?",
    answer:
      "Students should be of school-going age and enrolled in one of the levels available on our platform.",
  },
  {
    question: "Is StudiesMasters a safe space for children?",
    answer:
      "StudiesMasters discourages sharing personal information during classes. Teachers are screened, and learning activity can be monitored to support student safety.",
  },
  {
    question: "Who do I contact if I have payment issues?",
    answer:
      "If you experience payment issues, use the contact form or email customersupport@studiesmasters.com. StudiesMasters will never ask for sensitive personal information via phone or email.",
  },
  {
    question: "If I forget my password, how do I recover my account?",
    answer:
      'You can reset your password by clicking the "Forgot Password" link on the login page.',
  },
  {
    question: "What subjects are available?",
    answer:
      "StudiesMasters offers subjects under GES and Cambridge, including English, Maths, Science, IGCSE English, IGCSE Maths, and exam mastery options.",
  },
  {
    question: "What grades are accepted?",
    answer:
      "GES covers Basic 4-6, JHS 1-3, and SHS 1-3. Cambridge covers Grade 4-12.",
  },
  {
    question: "Why StudiesMasters?",
    answer:
      "StudiesMasters helps students learn online, gives parents clearer progress visibility, and connects learners with experienced teachers.",
  },
  {
    question: "What packages are available?",
    answer:
      "StudiesMasters currently lists GES and Cambridge main subscription plans on the landing page.",
  },
  {
    question: "What is the duration period for a chosen package?",
    answer:
      "Main subscriptions run for 1 month. Check the package card for the exact plan details.",
  },
  {
    question: "Can a student register for more than one package?",
    answer:
      "Yes, but we recommend focusing on one package at a time for best results.",
  },
  {
    question: "How do I renew my package?",
    answer:
      "You can renew your package from the payment page on your student dashboard.",
  },
  {
    question: "Can I add a new subject to my existing package?",
    answer:
      "Yes, you can add a new subject by revisiting your payment page on your dashboard.",
  },
  {
    question: "Can I switch packages?",
    answer:
      "You can switch packages only when re-registering, not during an active package.",
  },
  {
    question: "Can I remove a subject from my package when re-registering?",
    answer:
      "Yes, you can remove a subject when re-registering via the payments page.",
  },
];

const ChatBotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const res = await fetch("https://studiesmasters-backend.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("Message sent successfully!");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("Failed to send message. Please try again.");
      }
    } catch (error) {
      setStatus("Network error. Try again later.");
    }
  };

  return (
    <div>
      <button
        type="button"
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl ring-4 ring-white/80 transition hover:bg-blue-700 sm:bottom-6 sm:right-6"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close help chat" : "Open help chat"}
      >
        {isOpen ? <FaTimes size={15} /> : <FaComments size={15} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-16 right-3 z-50 flex max-h-[70vh] w-[calc(100%-1.5rem)] max-w-xs flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-fadeIn sm:bottom-18 sm:right-6 sm:w-72">
          <div className="bg-slate-900 p-2.5 text-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold">StudiesMasters Help</h2>
                <p className="text-[10px] text-slate-300">
                  Quick answers and support
                </p>
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs">
                <FaComments />
              </span>
            </div>
          </div>

          <div className="overflow-y-auto bg-slate-50 p-2.5 space-y-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Frequently Asked Questions
              </h3>
              <p className="text-[10px] text-slate-500">
                Tap a question to view the answer.
              </p>
            </div>

            <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {faqs.map((faq, index) => (
                <div
                  key={faq.question}
                  className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] font-semibold leading-4 text-slate-800 hover:text-blue-700"
                    onClick={() =>
                      setActiveQuestion(activeQuestion === index ? null : index)
                    }
                  >
                    <span>{faq.question}</span>
                    <FaChevronDown
                      className={`shrink-0 text-[10px] transition ${
                        activeQuestion === index
                          ? "rotate-180 text-blue-600"
                          : "text-slate-400"
                      }`}
                    />
                  </button>

                  {activeQuestion === index && (
                    <p className="border-t border-slate-100 px-2.5 pb-2.5 pt-2 text-[11px] leading-5 text-slate-600">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <a
              href={`mailto:${supportEmail}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-2.5 py-2 text-[11px] font-semibold text-white shadow hover:bg-blue-700"
            >
              <FaEnvelope />
              {supportEmail}
            </a>

            <div className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xs font-bold text-slate-900">
                Still need help?
              </h3>
              <p className="mb-2 text-[10px] text-slate-500">
                Send a message and our team will get back to you.
              </p>

              <form onSubmit={handleSubmit} className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full rounded-md border border-slate-200 p-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full rounded-md border border-slate-200 p-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <textarea
                  placeholder="Type your message..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  rows={2}
                  className="w-full resize-none rounded-md border border-slate-200 p-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                ></textarea>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800"
                >
                  <FaPaperPlane />
                  Send Message
                </button>
              </form>

              {status && (
                <p className="text-[10px] text-center mt-2 text-slate-500">
                  {status}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBotWidget;
