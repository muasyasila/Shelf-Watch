"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function OnboardingTour() {
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Check if user wants to see the tour (via URL param)
      const urlParams = new URLSearchParams(window.location.search);
      const forceTour = urlParams.get("tour") === "true";
      const tourCompleted = localStorage.getItem("shelfwatch_tour_completed");
      
      // Show tour if: force=true OR tour not completed
      if (forceTour || !tourCompleted) {
        startTour();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      steps: [
        {
          element: ".tour-stats",
          popover: {
            title: "📊 At a Glance",
            description: "See your critical stockouts, at-risk items, healthy SKUs, and resolution rate at a glance.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: ".tour-filters",
          popover: {
            title: "🔍 Filter Your Data",
            description: "Filter by store or risk level to focus on what matters most.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: ".tour-competitor",
          popover: {
            title: "🎯 Competitor Intelligence",
            description: "Toggle this on to see competitor stock levels. Green means you have an advantage. Red means they have more stock than you.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: ".tour-simulator",
          popover: {
            title: "📈 'What If' Simulator",
            description: "Drag this slider to see what happens if sales increase. Days until stockout will update in real-time.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: ".tour-alerts",
          popover: {
            title: "🔔 Recent Alerts",
            description: "All SMS alerts and dispatch orders appear here. Track every action you take.",
            side: "top",
            align: "start",
          },
        },
        {
          element: ".tour-table",
          popover: {
            title: "📋 Inventory Table",
            description: "Every product across all stores. Color-coded by risk level.",
            side: "top",
            align: "start",
          },
        },
        {
          element: ".tour-sms",
          popover: {
            title: "📱 Send SMS Alert",
            description: "Click this to send an immediate SMS alert to the store manager. Use when stock is critically low.",
            side: "left",
            align: "start",
          },
        },
        {
          element: ".tour-dispatch",
          popover: {
            title: "🚚 Dispatch Stock",
            description: "Create a restock order. This automatically marks the issue as 'In Progress'.",
            side: "left",
            align: "start",
          },
        },
        {
          element: ".tour-resolution",
          popover: {
            title: "✅ Resolution Tracking",
            description: "Pending = Not started. In Progress = Dispatch created. Resolved = Stock replenished. Click 'Start' then 'Resolve' to close the loop.",
            side: "left",
            align: "start",
          },
        },
        {
          element: ".tour-export",
          popover: {
            title: "📎 Export & Share",
            description: "Download as CSV or email the report directly to your team.",
            side: "bottom",
            align: "end",
          },
        },
        {
          element: ".tour-restart-button",
          popover: {
            title: "🔄 Need the tour again?",
            description: "Click the 'Tour' button in the top right corner anytime to restart this guided walkthrough.",
            side: "bottom",
            align: "end",
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem("shelfwatch_tour_completed", "true");
      },
    });

    driverObj.drive();
  };

  return null;
}