"use client";
import { useState } from "react";
import {
  Users,
  Target,
  Award,
  Briefcase,
  BookOpen,
  Rocket,
} from "lucide-react";

const AboutUsPage = () => {
  const [activeTab, setActiveTab] = useState("mission");

  const tabContent = {
    mission: {
      icon: <Target className="mr-2 text-indigo-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-base md:text-lg">
            Provide an Interface that helps the young generation prepare for
            their Interviews.
          </p>
          <p className="text-base md:text-lg"></p>
        </div>
      ),
    },
    story: {
      icon: <BookOpen className="mr-2 text-indigo-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-base md:text-lg">
            Statistically, only 10% of Indians are qualified to attend an
            interview properly.
          </p>
          <p className="text-base md:text-lg">
            We wanted to help everyone be prepared for an interview by helping
            them train through our Interface that gives them feedback on how to
            improve.
          </p>
        </div>
      ),
    },
    approach: {
      icon: <Rocket className="mr-2 text-indigo-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-base md:text-lg">
            We decided to approach this problem by analyzing facial expression
            and speech tones to gauge the emotion and based on these emotions
            and their answers to the questions,
          </p>
          <p className="text-base md:text-lg">
            We can give them a rating for that question and an overall rating
            for the interview, by which they can improve upon.
          </p>
        </div>
      ),
    },
  };

  const coreValues = [
    {
      icon: <Award className="w-12 h-12 text-indigo-600 mb-4" />,
      title: "Continuous Learning",
      description:
        "Always striving to improve and provide better tools for growth.",
    },
    {
      icon: <Users className="w-12 h-12 text-indigo-600 mb-4" />,
      title: "Empowerment",
      description:
        "Supporting individuals in building confidence and achieving professional success.",
    },
    {
      icon: <Briefcase className="w-12 h-12 text-indigo-600 mb-4" />,
      title: "Excellence",
      description:
        "Delivering high-quality, impactful features to simplify interview preparation.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900">
            About MockMate AI
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg md:text-xl text-gray-600 px-4">
            Empowering professionals to ace interviews through intelligent,
            personalized AI coaching
          </p>
        </div>

        {/* Tabs Section */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8 sm:mb-12 md:mb-16">
          <div className="flex flex-col sm:flex-row border-b">
            {Object.keys(tabContent).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full sm:flex-1 py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center 
                  ${
                    activeTab === tab
                      ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
              >
                {tabContent[tab].icon}
                <span className="hidden sm:inline">
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-6 md:p-8">
            {tabContent[activeTab].content}
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-10 md:mb-12">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {coreValues.map((value, index) => (
              <div
                key={index}
                className="text-center bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-center">{value.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-base text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
