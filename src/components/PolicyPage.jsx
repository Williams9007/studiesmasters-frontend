import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaFileContract,
  FaShieldAlt,
  FaUserLock,
  FaArrowLeft,
  FaHome,
  FaEnvelope,
  FaGlobe,
} from "react-icons/fa";

const PolicyPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("terms");

  const tabs = [
    { id: "terms", label: "Terms & Conditions", icon: <FaFileContract /> },
    { id: "parent", label: "Parent Service Agreement", icon: <FaBookOpen /> },
    { id: "privacy", label: "Privacy Policy", icon: <FaShieldAlt /> },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition"
            >
              <FaArrowLeft className="text-sm" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-2">
              <FaBookOpen className="text-blue-600 text-xl" />
              <span className="text-xl font-bold text-gray-800">
                StudiesMasters
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Policies & Agreements
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto">
            Review our Terms & Conditions, Parent Service Agreement, and Privacy
            Policy to understand how we serve and protect our community.
          </p>
          <p className="text-blue-200 text-sm mt-4">
            Effective Date: 08/03/2026
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="flex flex-wrap gap-2 bg-white rounded-xl shadow-lg p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex-1 sm:flex-none justify-center ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Policy Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Terms & Conditions */}
        {activeTab === "terms" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
              <FaFileContract className="text-blue-600 text-2xl" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                StudiesMasters Terms & Conditions
              </h2>
            </div>

            <p className="text-gray-600 leading-relaxed">
              <strong className="text-gray-800">Effective Date: 08/03/2026</strong>
            </p>

            <p className="text-gray-600 leading-relaxed">
              Welcome to StudiesMasters. These Terms & Conditions govern your
              use of the StudiesMasters website, student platform, learning
              resources, and related services. By accessing or using our
              platform, you agree to these terms.
            </p>

            <div className="space-y-6">
              <PolicySection
                number="1"
                title="About StudiesMasters"
              >
                <p>
                  StudiesMasters is an online supplementary tutoring platform
                  providing structured academic support for students through
                  live online classes, learning resources, tutor guidance, and
                  academic support aligned with relevant curricula.
                </p>
                <p className="mt-2">
                  Our services are designed to support students alongside their
                  formal education and are not a replacement for a student's
                  primary school education.
                </p>
              </PolicySection>

              <PolicySection
                number="2"
                title="Use of Our Platform"
              >
                <p>Users agree to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Provide accurate information during registration.</li>
                  <li>Keep account information secure.</li>
                  <li>Use the platform responsibly and respectfully.</li>
                  <li>
                    Avoid sharing login credentials with unauthorized persons.
                  </li>
                  <li>
                    Avoid misuse of learning materials, platform features, or
                    communication channels.
                  </li>
                </ul>
              </PolicySection>

              <PolicySection
                number="3"
                title="Student Accounts"
              >
                <p>Where a student account is created:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>
                    Parents/guardians are responsible for ensuring information
                    provided is accurate.
                  </li>
                  <li>
                    Parents/guardians are responsible for supervising
                    appropriate use of student access details.
                  </li>
                  <li>
                    StudiesMasters may update or suspend access where misuse or
                    policy violations occur.
                  </li>
                </ul>
              </PolicySection>

              <PolicySection
                number="4"
                title="Learning Services"
              >
                <p>StudiesMasters provides:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Online tutoring sessions.</li>
                  <li>Academic support.</li>
                  <li>Learning resources.</li>
                  <li>Student progress support.</li>
                </ul>
                <p className="mt-2">
                  Class schedules, tutors, and learning arrangements may be
                  updated when operationally necessary.
                </p>
              </PolicySection>

              <PolicySection
                number="5"
                title="Intellectual Property"
              >
                <p>
                  Learning materials, resources, content, and platform features
                  provided by StudiesMasters remain the property of
                  StudiesMasters unless otherwise stated.
                </p>
                <p className="mt-2">
                  Users may use materials for personal learning purposes only
                  and may not reproduce, sell, distribute, or commercially use
                  them without permission.
                </p>
              </PolicySection>

              <PolicySection
                number="6"
                title="Platform Availability"
              >
                <p>
                  StudiesMasters will make reasonable efforts to provide
                  reliable access to its services. However, temporary
                  interruptions may occur due to technical issues, maintenance,
                  or circumstances outside our control.
                </p>
              </PolicySection>

              <PolicySection
                number="7"
                title="Communication"
              >
                <p>
                  By using our services, users agree that StudiesMasters may
                  communicate important information through approved channels
                  including:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Email</li>
                  <li>WhatsApp</li>
                  <li>Phone communication</li>
                  <li>Platform notifications</li>
                </ul>
              </PolicySection>

              <PolicySection
                number="8"
                title="Changes to These Terms"
              >
                <p>
                  StudiesMasters may update these Terms & Conditions from time
                  to time. Updated versions will be published on our website.
                </p>
              </PolicySection>

              <PolicySection
                number="9"
                title="Contact Information"
              >
                <p>
                  For questions regarding these terms, contact:
                </p>
                <div className="mt-2 bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="flex items-center gap-2 text-gray-700">
                    <FaBookOpen className="text-blue-600" />
                    <strong>StudiesMasters Limited</strong>
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <FaEnvelope className="text-blue-600" />
                    Email:{" "}
                    <a
                      href="mailto:customersupport@studiesmasters.com"
                      className="text-blue-600 hover:underline"
                    >
                      customersupport@studiesmasters.com
                    </a>
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <FaGlobe className="text-blue-600" />
                    Website:{" "}
                    <a
                      href="https://www.studiesmasters.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      www.studiesmasters.com
                    </a>
                  </p>
                </div>
              </PolicySection>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <p className="text-gray-500 italic">
                By using StudiesMasters services, you acknowledge that you have
                read and accepted these Terms & Conditions.
              </p>
            </div>
          </div>
        )}

        {/* Parent Service Agreement */}
        {activeTab === "parent" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
              <FaBookOpen className="text-blue-600 text-2xl" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                StudiesMasters Parent Service Agreement
              </h2>
            </div>

            <p className="text-gray-600 leading-relaxed">
              <strong className="text-gray-800">Effective Date: 08/03/2026</strong>
            </p>

            <p className="text-gray-600 leading-relaxed">
              This Parent Service Agreement explains the relationship between
              StudiesMasters Limited and the parent/guardian enrolling a student
              for online tutoring services.
            </p>
            <p className="text-gray-600 leading-relaxed">
              By enrolling a student with StudiesMasters, the parent/guardian
              agrees to the terms below.
            </p>

            <div className="space-y-6">
              <PolicySection
                number="1"
                title="Student Enrollment"
              >
                <p>The parent/guardian confirms that:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>
                    The information provided during enrollment is accurate.
                  </li>
                  <li>
                    They have authority to enroll the student.
                  </li>
                  <li>
                    They understand the selected StudiesMasters subscription
                    package.
                  </li>
                </ul>
              </PolicySection>

              <PolicySection
                number="2"
                title="Services Provided"
              >
                <p>
                  StudiesMasters provides online supplementary tutoring services
                  including:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Live online lessons.</li>
                  <li>Academic guidance.</li>
                  <li>Learning support.</li>
                  <li>Access to relevant learning resources.</li>
                </ul>
                <p className="mt-2">
                  The selected subscription plan determines the subjects and
                  services available to the student.
                </p>
              </PolicySection>

              <PolicySection
                number="3"
                title="Subscription and Payments"
              >
                <p>The parent/guardian agrees to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>
                    Pay subscription fees according to the selected plan.
                  </li>
                  <li>Maintain active payment arrangements.</li>
                  <li>
                    Understand that continued access depends on an active
                    subscription.
                  </li>
                </ul>
                <p className="mt-2">
                  Subscription plans may be renewed, upgraded, or changed
                  according to StudiesMasters policies.
                </p>
              </PolicySection>

              <PolicySection
                number="4"
                title="Class Attendance"
              >
                <p>
                  Parents/guardians are responsible for supporting student
                  attendance by ensuring:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Access to required devices.</li>
                  <li>Suitable learning environment.</li>
                  <li>Attendance at scheduled lessons.</li>
                </ul>
                <p className="mt-2">
                  StudiesMasters will communicate reasonable updates regarding
                  class arrangements.
                </p>
              </PolicySection>

              <PolicySection
                number="5"
                title="Tutor and Class Arrangements"
              >
                <p>
                  StudiesMasters assigns tutors and organises classes based on
                  operational requirements.
                </p>
                <p className="mt-2">
                  StudiesMasters may adjust tutors, schedules, or class
                  arrangements where necessary to maintain service quality.
                </p>
              </PolicySection>

              <PolicySection
                number="6"
                title="Student Conduct"
              >
                <p>Students are expected to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Participate respectfully.</li>
                  <li>Follow online classroom rules.</li>
                  <li>Treat tutors and other learners appropriately.</li>
                  <li>Use learning platforms responsibly.</li>
                </ul>
              </PolicySection>

              <PolicySection
                number="7"
                title="Parent Communication"
              >
                <p>Parents agree to receive important service communications relating to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Enrollment.</li>
                  <li>Class schedules.</li>
                  <li>Learning updates.</li>
                  <li>Renewals.</li>
                  <li>Service announcements.</li>
                </ul>
              </PolicySection>

              <PolicySection
                number="8"
                title="Cancellation and Withdrawal"
              >
                <p>
                  Parents may request cancellation according to StudiesMasters
                  withdrawal procedures.
                </p>
                <p className="mt-2">
                  Any outstanding payments or applicable policies will be
                  handled according to the agreed subscription terms.
                </p>
              </PolicySection>

              <PolicySection
                number="9"
                title="Academic Expectations"
              >
                <p>
                  StudiesMasters provides academic support but does not
                  guarantee specific examination results or grades.
                </p>
                <p className="mt-2">
                  Student progress depends on multiple factors including
                  attendance, participation, effort, and external academic
                  circumstances.
                </p>
              </PolicySection>

              <PolicySection
                number="10"
                title="Acceptance"
              >
                <p>
                  By enrolling a student with StudiesMasters, the
                  parent/guardian confirms that they understand and accept this
                  Parent Service Agreement.
                </p>
              </PolicySection>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <p className="text-gray-500 italic">
                By enrolling a student with StudiesMasters, the parent/guardian
                confirms that they understand and accept this Parent Service
                Agreement.
              </p>
            </div>
          </div>
        )}

        {/* Privacy Policy */}
        {activeTab === "privacy" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
              <FaShieldAlt className="text-blue-600 text-2xl" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                StudiesMasters Privacy Policy
              </h2>
            </div>

            <p className="text-gray-600 leading-relaxed">
              <strong className="text-gray-800">Effective Date: 08/03/2026</strong>
            </p>

            <p className="text-gray-600 leading-relaxed">
              StudiesMasters respects your privacy and is committed to
              protecting the personal information of parents, students, tutors,
              and users of our platform.
            </p>

            <div className="space-y-6">
              <PolicySection
                number="1"
                title="Information We Collect"
              >
                <p>StudiesMasters may collect information including:</p>
                <div className="mt-3 space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FaUserLock className="text-blue-600" /> Parent
                      Information
                    </h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-600 text-sm">
                      <li>Name</li>
                      <li>Phone number</li>
                      <li>Email address</li>
                      <li>Communication details</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FaUserLock className="text-blue-600" /> Student
                      Information
                    </h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-600 text-sm">
                      <li>Name</li>
                      <li>Grade level</li>
                      <li>Curriculum</li>
                      <li>Academic programme information</li>
                      <li>Learning progress information</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FaUserLock className="text-blue-600" /> Account
                      Information
                    </h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-600 text-sm">
                      <li>Login details</li>
                      <li>Platform usage information</li>
                      <li>Communication history</li>
                    </ul>
                  </div>
                </div>
              </PolicySection>

              <PolicySection
                number="2"
                title="Why We Collect Information"
              >
                <p>We collect information to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Process student enrollment.</li>
                  <li>Provide tutoring services.</li>
                  <li>Create student accounts.</li>
                  <li>Communicate important updates.</li>
                  <li>Manage learning activities.</li>
                  <li>Improve our services.</li>
                  <li>Provide customer support.</li>
                </ul>
              </PolicySection>

              <PolicySection
                number="3"
                title="How We Use Student Information"
              >
                <p>Student information may be used for:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Assigning appropriate learning programmes.</li>
                  <li>Organising classes.</li>
                  <li>Supporting tutors.</li>
                  <li>Monitoring learning engagement.</li>
                  <li>Providing academic updates.</li>
                </ul>
              </PolicySection>

              <PolicySection
                number="4"
                title="Information Sharing"
              >
                <p>
                  StudiesMasters does not sell personal information.
                </p>
                <p className="mt-2">
                  Information may only be shared with relevant parties where
                  necessary to provide services, including:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Assigned tutors.</li>
                  <li>Academic operations staff.</li>
                  <li>Technology service providers supporting our platform.</li>
                </ul>
              </PolicySection>

              <PolicySection
                number="5"
                title="Data Security"
              >
                <p>
                  StudiesMasters takes reasonable steps to protect personal
                  information from unauthorized access, misuse, or loss.
                </p>
              </PolicySection>

              <PolicySection
                number="6"
                title="Communication Preferences"
              >
                <p>
                  Parents may receive service-related communications including:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Enrollment updates.</li>
                  <li>Class schedules.</li>
                  <li>Learning updates.</li>
                  <li>Renewal reminders.</li>
                  <li>Important announcements.</li>
                </ul>
              </PolicySection>

              <PolicySection
                number="7"
                title="Children's Information"
              >
                <p>
                  StudiesMasters collects student information only for the
                  purpose of providing educational support and works with
                  parents/guardians as the responsible decision-makers for
                  student enrollment.
                </p>
              </PolicySection>

              <PolicySection
                number="8"
                title="Your Rights"
              >
                <p>Parents may request:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>Access to their information.</li>
                  <li>Updates to inaccurate information.</li>
                  <li>Clarification on how information is used.</li>
                </ul>
              </PolicySection>

              <PolicySection
                number="9"
                title="Contact Us"
              >
                <p>For privacy-related questions:</p>
                <div className="mt-2 bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="flex items-center gap-2 text-gray-700">
                    <FaBookOpen className="text-blue-600" />
                    <strong>StudiesMasters Limited</strong>
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <FaEnvelope className="text-blue-600" />
                    Email:{" "}
                    <a
                      href="mailto:customersupport@studiesmasters.com"
                      className="text-blue-600 hover:underline"
                    >
                      customersupport@studiesmasters.com
                    </a>
                  </p>
                </div>
              </PolicySection>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <p className="text-gray-500 italic">
                By using StudiesMasters services, you consent to the collection
                and use of information as described in this Privacy Policy.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FaBookOpen className="text-blue-400 text-xl" />
                <span className="text-xl font-bold text-white">
                  StudiesMasters
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Empowering students through quality online supplementary
                education.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Policy Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("terms")}
                  className="block text-sm text-gray-400 hover:text-blue-400 transition"
                >
                  Terms & Conditions
                </button>
                <button
                  onClick={() => setActiveTab("privacy")}
                  className="block text-sm text-gray-400 hover:text-blue-400 transition"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setActiveTab("parent")}
                  className="block text-sm text-gray-400 hover:text-blue-400 transition"
                >
                  Parent Service Agreement
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition"
                >
                  <FaHome className="text-xs" /> Home
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-sm text-gray-500">
              &copy; 2026 StudiesMasters. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const PolicySection = ({ number, title, children }) => (
  <div className="bg-gray-50 rounded-xl p-5 border-l-4 border-blue-500">
    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
        {number}
      </span>
      {title}
    </h3>
    <div className="text-gray-600 leading-relaxed space-y-2 text-sm sm:text-base">
      {children}
    </div>
  </div>
);

export default PolicyPage;
