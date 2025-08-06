"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { UserAnswer } from "@/utils/schema";
import { MockInterview } from "@/utils/schema";
import { Bot, Plus, ListChecks, Trophy, Zap, TrendingUp } from "lucide-react";

import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/InterviewList";

function Dashboard() {
  const { user } = useUser();
  const [interviewData, setInterviewData] = useState([]);
  const [isNewInterviewModalOpen, setIsNewInterviewModalOpen] = useState(false);
  const [statsCards, setStatsCards] = useState([
    {
      icon: <ListChecks size={32} className="text-indigo-600" />,
      title: "Total Interviews",
      value: "0",
    },
    {
      icon: <Trophy size={32} className="text-green-600" />,
      title: "Best Score",
      value: "N/A",
    },
    {
      icon: <TrendingUp size={32} className="text-blue-600" />,
      title: "Improvement Rate",
      value: "0%",
    },
  ]);

  const fetchInterviews = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      toast.error("User email not found");
      return;
    }

    try {
      console.log(
        "Fetching interviews for user:",
        user.primaryEmailAddress.emailAddress
      );

      // Fetch interviews from MockInterview where createdBy matches the user's email
      const userInterviews = await db
        .select()
        .from(MockInterview)
        .where(
          eq(MockInterview.createdBy, user.primaryEmailAddress.emailAddress)
        );

      console.log("Fetched MockInterviews:", userInterviews);

      const totalInterviews = userInterviews.length;

      // Fetch user answers
      const userAnswers = await db
        .select()
        .from(UserAnswer)
        .where(eq(UserAnswer.userEmail, user.primaryEmailAddress.emailAddress));

      console.log("User Answers:", userAnswers);

      // Calculate best score and improvement rate
      const scores = userAnswers
        .map((item) => parseInt(item.rating || "0"))
        .filter((score) => !isNaN(score));

      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const improvementRate = calculateImprovementRate(scores);

      setStatsCards([
        {
          icon: <ListChecks size={32} className="text-indigo-600" />,
          title: "Total Interviews",
          value: totalInterviews.toString(),
        },
        {
          icon: <Trophy size={32} className="text-green-600" />,
          title: "Best Score",
          value: bestScore ? `${bestScore}/10` : "N/A",
        },
        {
          icon: <TrendingUp size={32} className="text-blue-600" />,
          title: "Improvement Rate",
          value: `${improvementRate}%`,
        },
      ]);

      if (totalInterviews > 0) {
        toast.success(`Loaded ${totalInterviews} unique interview(s)`);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast.error(error.message || "Failed to fetch interviews");
    }
  };

  const calculateImprovementRate = (scores) => {
    if (scores.length <= 1) return 0; // Not enough data to calculate improvement

    // Sort scores in ascending order
    const sortedScores = [...scores].sort((a, b) => a - b);
    const firstScore = sortedScores[0];
    const lastScore = sortedScores[sortedScores.length - 1];

    console.log("Sorted Scores:", sortedScores); // Debugging log
    console.log(`First Score: ${firstScore}, Last Score: ${lastScore}`); // Debugging log

    if (firstScore === lastScore) return 0; // No improvement

    // Handle edge case where first score is 0
    if (firstScore === 0) {
      return lastScore * 10; // Arbitrary scale factor to indicate improvement
    }

    const improvement = ((lastScore - firstScore) / firstScore) * 100;
    return Math.round(improvement);
  };

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchInterviews();
    }
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* User Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Bot className="text-indigo-600" size={32} />
            Dashboard
          </h2>
          <h3 className="text-lg sm:text-xl text-gray-600 mt-2">
            Welcome, {user?.firstName || "Interviewer"}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm sm:text-base">
            {user?.primaryEmailAddress?.emailAddress || "Not logged in"}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {statsCards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
          >
            {card.icon}
            <div className="ml-4">
              <p className="text-xs sm:text-sm text-gray-500">{card.title}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Interview Section */}
      <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-3">
            <Zap size={24} className="text-yellow-500" />
            Create AI Mock Interview
          </h2>
          {/* <button
            onClick={() => setIsNewInterviewModalOpen(true)}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            New Interview
          </button> */}
        </div>

        {/* Add New Interview Component */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <AddNewInterview
            isOpen={isNewInterviewModalOpen}
            onClose={() => setIsNewInterviewModalOpen(false)}
          />
        </div>
      </div>

      {/* Interview History */}
      <div className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
          Interview History
        </h2>
        <InterviewList interviews={interviewData} />
      </div>
    </div>
  );
}

export default Dashboard;
