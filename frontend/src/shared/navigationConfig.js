import { BookOpen, GraduationCap, PenLine, Tv, FileEdit } from "lucide-react";

export const LEVELS = [
  {
    id: "A0",
    label: "A0",
    title: "Absolute-beginner foundations",
    weeks: "Week 1",
    startDay: 1,
    endDay: 7,
    description:
      "Start from zero and build the minimum language needed to introduce yourself and participate in very simple exchanges.",
    goals: [
      "Use basic greetings, the French alphabet and essential classroom expressions.",
      "Say your name, location, nationality and profession in short sentences.",
    ],
  },
  {
    id: "A1",
    label: "A1",
    title: "Basic everyday communication",
    weeks: "Weeks 2–10",
    startDay: 8,
    endDay: 70,
    description:
      "Develop reliable beginner communication for familiar people, routines, shopping, travel, health, services, work and study.",
    goals: [
      "Understand and produce short, predictable everyday exchanges.",
      "Use present-tense basics, articles, agreement, questions, negation and common verbs.",
    ],
  },
  {
    id: "A2",
    label: "A2",
    title: "Independent everyday communication",
    weeks: "Weeks 11–20",
    startDay: 71,
    endDay: 140,
    description:
      "Move beyond memorized phrases and handle routine situations with longer descriptions, explanations and narratives.",
    goals: [
      "Compare choices, negotiate arrangements and resolve common practical problems.",
      "Describe past situations using passé composé and imparfait with growing control.",
    ],
  },
  {
    id: "B1",
    label: "B1",
    title: "Structured independent communication",
    weeks: "Weeks 21–35",
    startDay: 141,
    endDay: 245,
    description:
      "Build sustained, organized communication for professional, social and public-life topics while preparing for exam-style interaction.",
    goals: [
      "State, support, qualify and defend opinions with reasons and examples.",
      "Narrate experiences clearly and manage workplace or administrative situations.",
    ],
  },
  {
    id: "B2",
    label: "B2 / NCLC 7",
    title: "Exam performance and readiness",
    weeks: "Weeks 36–43",
    startDay: 246,
    endDay: 301,
    description:
      "Convert upper-intermediate French into stable NCLC 7-oriented performance under realistic time, interaction and stamina demands.",
    goals: [
      "Understand stance, structure, detail and supported implications in B2 material.",
      "Gather information, persuade and defend a position through sustained interaction.",
    ],
  },
];

export const SECTIONS = [
  {
    id: "anki",
    name: "Anki vocabulary",
    tagline: "Daily flashcards, both directions",
    icon: BookOpen,
    active: true,
  },
  {
    id: "grammar",
    name: "Grammar book",
    tagline: "Grammaire Progressive du Français",
    icon: GraduationCap,
    active: true,
  },
  {
    id: "kwiziq",
    name: "Kwiziq",
    tagline: "Daily lesson links",
    icon: PenLine,
    active: true,
  },
  {
    id: "tv5monde",
    name: "TV5MONDE",
    tagline: "Daily listening links",
    icon: Tv,
    active: true,
  },
  {
    id: "writing",
    name: "Writing",
    tagline: "Daily writing task",
    icon: FileEdit,
    active: true,
  },
];
