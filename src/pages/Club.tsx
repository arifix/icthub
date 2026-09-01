import React, { useEffect } from "react";
import {
  GraduationCap,
  Users,
  FlaskConical,
  Lightbulb,
  Presentation,
  Code2,
  BookOpen,
  Network,
  ArrowRight,
  Calendar,
  Award,
  Target,
  UserRoundCheck,
} from "lucide-react";

const Club: React.FC = () => {
  const activities = [
    {
      icon: FlaskConical,
      title: "Research & Publication",
      description:
        "Faculty-guided research discussions, paper reading sessions, thesis collaboration, and support for conference and journal publications.",
      color: "blue",
    },
    {
      icon: Code2,
      title: "Technology & Projects",
      description:
        "Hands-on projects and technical workshops covering AI, IoT, cybersecurity, communication systems, data science, and emerging technologies.",
      color: "indigo",
    },
    {
      icon: Presentation,
      title: "Seminars & Workshops",
      description:
        "Regular academic seminars with faculty members, researchers, alumni, and industry professionals.",
      color: "teal",
    },
    {
      icon: Lightbulb,
      title: "Innovation & Ideas",
      description:
        "A platform for students to turn research ideas into prototypes, solutions, demonstrations, and interdisciplinary projects.",
      color: "amber",
    },
    {
      icon: Network,
      title: "Academic Networking",
      description:
        "Connect MSc students with faculty, alumni, researchers, industry professionals, and international academic communities.",
      color: "purple",
    },
    {
      icon: Award,
      title: "Competitions & Showcase",
      description:
        "Organize hackathons, research presentations, poster exhibitions, project showcases, and innovation challenges.",
      color: "rose",
    },
  ];

  const researchGroups = [
    "Artificial Intelligence & Machine Learning",
    "Computer Vision & Image Processing",
    "IoT & Embedded Systems",
    "Communication & Networking",
    "Cybersecurity",
    "Data Science & NLP",
    "Signal Processing",
    "Emerging ICT Technologies",
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-[#f0f7ff] text-[#0066ff] border-[#e6f2ff]",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    teal: "bg-[#f0f7ff] text-[#0066ff] border-[#e6f2ff]",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  useEffect(() => {
    document.title = "IICT Club — ICTHub";
  }, []);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative px-6 sm:px-10 lg:px-14 py-12 sm:py-16 text-center">
              <div className="absolute top-0 right-0 w-56 h-56 bg-[#e6f2ff] rounded-bl-full opacity-50" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-100 rounded-tr-full opacity-40" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0066ff] rounded-2xl shadow-lg mb-5">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>

                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#0066ff] mb-3">
                  IICT • KUET
                </span>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-5">
                  IICT Academic & Technology Club
                </h1>

                <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed">
                  A faculty-guided platform for MSc students of ICT and IICT to
                  collaborate in research, technology, innovation, and
                  professional development.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                  {/* <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
                    Explore Club Activities
                    <ArrowRight className="w-4 h-4" />
                  </button> */}

                  <button
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                    onClick={() => alert("Registration coming soon!")}
                  >
                    <Users className="w-4 h-4" />
                    Become a Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-5">
            <span className="section-label">Our Purpose</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Learn. Research. Build. Connect.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <Target className="w-7 h-7 text-[#0066ff] mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">
                Academic Excellence
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Encourage deeper learning, research skills, critical thinking,
                and academic collaboration among MSc students.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <Lightbulb className="w-7 h-7 text-amber-500 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Innovation</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Turn ideas and research problems into practical projects,
                prototypes, demonstrations, and useful solutions.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <Network className="w-7 h-7 text-indigo-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Community</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Build a strong academic community connecting students, teachers,
                alumni, researchers, and industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="section-label">What We Do</span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Club Activities
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activities.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${
                    colorClasses[color]
                  } mb-5 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-[#0066ff] transition-colors">
                  {title}
                </h3>

                <p className="text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Groups */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#f0f7ff] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-[#0066ff]" />
              </div>

              <div>
                <span className="section-label">Research Community</span>
                <h2 className="text-xl font-bold text-gray-900">
                  Research Interest Groups
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Faculty-guided groups where students can discuss papers,
                  identify research problems, and develop projects.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {researchGroups.map((group) => (
                <div
                  key={group}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3"
                >
                  <div className="w-2 h-2 rounded-full bg-[#f0f7ff]0 shrink-0" />
                  <span className="text-sm font-medium text-gray-700">
                    {group}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Regular Programs */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-5">
            <span className="section-label">Regular Programs</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Our Academic Calendar
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: BookOpen,
                title: "Paper Reading",
                text: "Weekly or biweekly",
              },
              {
                icon: Presentation,
                title: "Research Seminar",
                text: "Monthly",
              },
              {
                icon: Code2,
                title: "Technical Workshop",
                text: "Every 2-3 months",
              },
              {
                icon: Award,
                title: "Research Showcase",
                text: "Each semester",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <Icon className="w-6 h-6 text-indigo-600 mb-4" />
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  {title}
                </h3>
                <p className="text-xs text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty Guidance */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-[#0066ff] text-white p-7 sm:p-10">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-bl-full" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs uppercase tracking-[0.18em] font-semibold text-[#e6f2ff]">
                  Faculty Guided
                </span>

                <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-4">
                  Students lead. Teachers guide.
                </h2>

                <p className="text-[#e6f2ff] text-sm leading-relaxed max-w-xl">
                  The club will operate under the guidance of IICT faculty
                  members, with students taking responsibility for planning,
                  coordination, projects, research discussions, and community
                  activities.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Faculty Mentors", UserRoundCheck],
                  ["Research Groups", FlaskConical],
                  ["Student Projects", Code2],
                  ["Academic Events", Calendar],
                ].map(([label, Icon]: any) => (
                  <div
                    key={label}
                    className="bg-white/10 border border-white/10 rounded-2xl p-4"
                  >
                    <Icon className="w-5 h-5 text-white mb-3" />
                    <p className="text-sm font-semibold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Club;
