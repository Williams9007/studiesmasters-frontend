import React, { useState } from "react";
import { FaComments, FaTimes } from "react-icons/fa";

const ChatBotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const faqs = [
    {
      question: "What is EduConnectt all about?",
      answer:
        "EduConnectt is an educational platform designed to connect teachers and students for virtual after-school classes.",
    },
    {
      question: "Who does EduConnectt deal with?",
      answer:
        "EduConnectt exclusively serves parents or guardians aged 18 and over who wish to register their children for online after-school classes. Parents are advised to supervise their children during learning periods.",
    },
    {
      question: "What student age is appropriate to register your ward for EduConnectt?",
      answer:
        "EduConnectt does not impose an age limit for students. However, all students must be of school-going age and currently enrolled in one of the classes available on our platform.",
    },
    {
      question: "Is EduConnectt a safe space for children?",
      answer:
        "EduConnectt strictly prohibits the sharing of personal information on any platform. Teachers are screened thoroughly and teacher-student chats are monitored and recorded to ensure safety.",
    },
    {
      question: "Who do I contact if I have any issues regarding payments?",
      answer:
        'If you experience any payment issues, please use this contact form to reach our team. We will respond via email within two business days. Note: EduConnectt will never ask for your personal information via phone or email.',
    },
    {
      question: "If I forget my password, how do I recover my account?",
      answer:
        'You can reset your password by clicking the "Forgot Password" link on the login page.',
    },
    {
      question: "What are some of the subjects treated by EduConnectt?",
      answer:
        "EduConnectt currently offers two curricula: Cambridge and GES. Visit the main page for the full list of subjects available for registration.",
    },
    {
      question: "What grades are acceptable on EduConnectt?",
      answer:
        "Cambridge Curriculum: Stage 4–13 (including IGCSE & A-Level prep). GES Curriculum: Basic 4–SSS4 (including BECE, WASSCE & Remedial prep).",
    },
    {
      question: "Why EduConnectt?",
      answer:
        "EduConnectt allows teachers to focus solely on teaching, ensures parents can monitor academic progress, and provides a safe and tech-savvy learning environment for students.",
    },
    {
      question: "What are the available packages run under EduConnectt?",
      answer:
        "EduConnectt offers After-School Classes, Vacation Classes, One-on-One Sessions, Weekend Tutoring, Remedial, and Special Classes. Visit our main page for more details.",
    },
    {
      question: "What is the duration period for a chosen package?",
      answer:
        "Each package has a specific duration. Check the main page for details about your chosen package.",
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
        setStatus("✅ Message sent successfully!");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("❌ Failed to send message. Please try again.");
      }
    } catch (error) {
      setStatus("❌ Network error. Try again later.");
    }
  };

  return (
    <div>
      {/* Floating Button */}
      <button
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FaTimes size={22} /> : <FaComments size={22} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-fadeIn">
          <div className="bg-blue-600 text-white p-4 font-semibold text-center">
            💬 EduConnectt Help Bot
          </div>

          <div className="p-4 overflow-y-auto h-80 space-y-3">
            <h3 className="text-lg font-bold mb-2 text-gray-700">Frequently Asked Questions</h3>

            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  className="w-full text-left text-sm font-medium text-blue-600 hover:underline"
                  onClick={() =>
                    setActiveQuestion(activeQuestion === index ? null : index)
                  }
                >
                  {faq.question}
                </button>
                {activeQuestion === index && (
                  <p className="text-gray-600 text-sm mt-1">{faq.answer}</p>
                )}
              </div>
            ))}

            <hr className="my-3" />
            <h3 className="text-lg font-bold mb-2 text-gray-700">
              Still need help? Contact us:
            </h3>

            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full border rounded p-2 text-sm"
              />
              <input
                type="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full border rounded p-2 text-sm"
              />
              <textarea
                placeholder="Type your message..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
                className="w-full border rounded p-2 text-sm"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Send Message
              </button>
            </form>

            {status && <p className="text-xs text-center mt-2">{status}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBotWidget;
