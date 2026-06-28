import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-session";
import { getStudentById } from "@/lib/services/cached";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, User, Phone, Calendar, Clock, Award, ShieldAlert, BadgeCheck } from "lucide-react";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";
import { formatAge, formatJoinedDate, formatTenure } from "@/lib/utils/student";

export default async function StudentProfilePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT" || !user.id) {
    redirect("/portal/login");
  }

  const student = await getStudentById(user.id);
  if (!student) {
    redirect("/portal/login");
  }

  const headerList = await headers();
  const host = headerList.get("host") || "";
  const isSubdomain = host === "portal.localhost" || host.startsWith("portal.");
  const backUrl = isSubdomain ? "/" : "/portal";

  const age = formatAge(student.dateOfBirth);
  const tenure = formatTenure(student.admissionDate);
  const joinedDate = formatJoinedDate(student.admissionDate);

  return (
    <main className="min-h-screen bg-[var(--background)] dark:bg-zinc-950 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-2">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white transition-all shadow-3xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-1.5">
            <img
              src="/icons/TAG-preloader-icon.webp"
              alt="TAG"
              className="h-[30px] w-auto shrink-0 dark:hidden"
            />
            <img
              src="/icons/TAG-min-dark-icon.webp"
              alt="TAG"
              className="h-[30px] w-auto shrink-0 hidden dark:block"
            />
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 capitalize">portal</p>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-[2.5rem] p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-brand-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Avatar */}
          <div className="relative shrink-0">
            <StudentAvatar
              student={student}
              size={128}
              className="w-28 h-28 sm:w-32 sm:h-32 object-cover border-4 border-white dark:border-zinc-850 shadow-md rounded-full"
            />
          </div>

          {/* Student Info */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-orange-500 bg-brand-orange-500/5 dark:bg-brand-orange-500/10 border border-brand-orange-500/20 px-3 py-1 rounded-full inline-block mb-3">
              {student.level.replace("_", " ")}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight truncate">
              {student.name}
            </h1>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-555 mt-1">
              Roll No: TAG{student.studentNumber}
            </p>
          </div>
        </div>

        {/* Profile Details List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-[2.5rem] p-8 sm:p-10 shadow-xl space-y-8">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[12px] border-b border-zinc-100 dark:border-zinc-800/60 pb-3.5">
            Student Profile Details
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 sm:gap-y-10">
            
            {/* Age */}
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-500 shrink-0">
                <User className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Age</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{age} years</p>
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-500 shrink-0">
                <BadgeCheck className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Gender</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{student.gender}</p>
              </div>
            </div>

            {/* DOB */}
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-500 shrink-0">
                <Calendar className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Date of Birth</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {new Date(student.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Parent Name */}
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-500 shrink-0">
                <User className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Parent Name</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{student.parentName}</p>
              </div>
            </div>

            {/* Contact Phone */}
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-500 shrink-0">
                <Phone className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Contact Phone</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  <a href={`tel:${student.contactNumber}`} className="hover:text-brand-orange-500 transition-colors">
                    {student.contactNumber}
                  </a>
                </p>
              </div>
            </div>

            {/* Joined Date */}
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-500 shrink-0">
                <Calendar className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Joined Date</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{joinedDate}</p>
              </div>
            </div>

            {/* Tenure */}
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-500 shrink-0">
                <Clock className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Tenure</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{tenure}</p>
              </div>
            </div>

          </div>

          {student.trainingFocus && (
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/40 animate-fade-in">
              <div className="flex items-center gap-2 mb-2.5">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Academy Training Focus & Emphasis
                </h3>
              </div>
              <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap pl-0">
                {student.trainingFocus}
              </p>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
