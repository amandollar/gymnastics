"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Download, Save, AlertCircle, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { bulkImportStudentsAction } from "@/lib/actions/students";

interface ParsedRow {
  id: string; // Internal temporary ID
  studentName: string;
  dateOfBirth: string; // raw string from excel
  parentName: string;
  contactNumber: string;
  admissionDate: string;
  startDate: string;
  endDate: string;
  totalSessions: string;
  fee: string;
  sessionsCompleted: string;
  attendancesStr: string; // Comma separated dates
  errors: Record<string, string>; // field -> error message
}

export default function BulkUploadClient() {
  const router = useRouter();
  const [data, setData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [globalError, setGlobalError] = useState("");

  const downloadSample = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Student Name": "John Doe",
        "Date of birth (YYYY-MM-DD)": "2015-05-20",
        "Parents name": "Jane Doe",
        "Contact Number": "9876543210",
        "Admission Date (YYYY-MM-DD)": "2025-10-15",
        "Start Date (YYYY-MM-DD)": "2025-10-15",
        "End Date (YYYY-MM-DD)": "2025-11-15",
        "Total Sessions": "12",
        "Fees": "3200",
        "Sessions Completed": "2",
        "Attendance Dates (Comma separated YYYY-MM-DD)": "2025-10-16, 2025-10-18"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, "bulk_upload_sample.xlsx");
  };

  const validateRow = (row: Partial<ParsedRow>): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!row.studentName?.trim()) errors.studentName = "Required";
    if (!row.parentName?.trim()) errors.parentName = "Required";
    if (!row.contactNumber?.trim() || !/^\d{10}$/.test(row.contactNumber.trim())) {
      errors.contactNumber = "Must be 10 digits";
    }
    
    const isValidDate = (d: string | undefined) => {
      if (!d) return false;
      const date = new Date(d);
      return !isNaN(date.getTime());
    };

    if (!isValidDate(row.dateOfBirth)) errors.dateOfBirth = "Invalid Date";
    if (!isValidDate(row.admissionDate)) errors.admissionDate = "Invalid Date";

    // Plan validation if any plan field is present
    if (row.startDate || row.endDate || row.totalSessions || row.fee) {
       if (!isValidDate(row.startDate)) errors.startDate = "Invalid Date";
       if (!isValidDate(row.endDate)) errors.endDate = "Invalid Date";
       if (isNaN(Number(row.totalSessions))) errors.totalSessions = "Must be number";
       if (isNaN(Number(row.fee))) errors.fee = "Must be number";
    }
    
    // Attendances basic validation: they should be empty or a list of dates
    if (row.attendancesStr) {
       const dates = row.attendancesStr.split(',').map(s => s.trim()).filter(Boolean);
       for (const d of dates) {
          if (!isValidDate(d)) {
             errors.attendancesStr = `Invalid date in list: ${d}`;
             break;
          }
       }
    }

    return errors;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setGlobalError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        const getVal = (r: any, possibleKeys: string[]) => {
          const keys = Object.keys(r);
          for (const k of keys) {
            const cleanKey = k.trim().toLowerCase();
            if (possibleKeys.some(pk => pk.toLowerCase() === cleanKey)) {
              return r[k];
            }
          }
          return "";
        };

        const parsedData: ParsedRow[] = jsonData.map((row, index) => {
          const formatLocalDate = (d: Date) => {
            if (isNaN(d.getTime())) return "";
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          };

          const parseDateString = (val: any) => {
            if (!val) return "";
            if (val instanceof Date) {
              // If it's a UTC date from xlsx, we should probably use UTC methods to get the correct date
              // xlsx parses serial dates to UTC midnight.
              return `${val.getUTCFullYear()}-${String(val.getUTCMonth() + 1).padStart(2, '0')}-${String(val.getUTCDate()).padStart(2, '0')}`;
            }
            if (typeof val === 'number') {
              const d = new Date(Math.round((val - 25569) * 86400 * 1000));
              return d.toISOString().split('T')[0];
            }
            const str = String(val).trim();
            
            const parts = str.split(/[\/\-.]/);
            if (parts.length === 3) {
              let [p1, p2, p3] = parts;
              if (p3.length === 2) {
                const year = parseInt(p3, 10);
                p3 = (year < 50 ? 2000 + year : 1900 + year).toString();
              }
              const d1 = parseInt(p1, 10);
              const m1 = parseInt(p2, 10);
              const y1 = parseInt(p3, 10);
              
              if (d1 <= 31 && m1 <= 12) {
                const dateObj = new Date(y1, m1 - 1, d1);
                if (!isNaN(dateObj.getTime())) return formatLocalDate(dateObj);
              } else if (m1 <= 31 && d1 <= 12) {
                const dateObj = new Date(y1, d1 - 1, m1);
                if (!isNaN(dateObj.getTime())) return formatLocalDate(dateObj);
              }
            }

            const d = new Date(str);
            if (!isNaN(d.getTime())) return formatLocalDate(d);
            return str;
          };

          const parseAttendancesFromRow = (r: any, startDateStr: string) => {
             const attendances: string[] = [];
             
             let lastDate = startDateStr ? new Date(startDateStr) : new Date();
             let hasSeenP = false;
             
             // Extract S1 to S100 columns
             for (let i = 1; i <= 100; i++) {
                const colKey = `S${i}`;
                let val = r[colKey];
                if (val === undefined) val = r[colKey.toLowerCase()];
                if (val === undefined) continue;

                if (val instanceof Date) {
                   lastDate = new Date(val.getTime());
                   attendances.push(formatLocalDate(lastDate));
                   hasSeenP = true;
                   continue;
                }
                
                if (typeof val === 'number') {
                   // excel serial date
                   lastDate = new Date(Math.round((val - 25569) * 86400 * 1000));
                   attendances.push(formatLocalDate(lastDate));
                   hasSeenP = true;
                   continue;
                }

                const str = String(val).trim().toUpperCase();
                
                if (str === "P") {
                   if (hasSeenP) {
                      lastDate.setDate(lastDate.getDate() + 1);
                   }
                   attendances.push(formatLocalDate(lastDate));
                   hasSeenP = true;
                } else if (str.includes("P")) {
                   const datePart = str.replace("P", "").trim(); 
                   let parsed = new Date(datePart);
                   if (isNaN(parsed.getTime())) {
                      parsed = new Date(`${datePart} ${lastDate.getFullYear()}`);
                   }
                   if (!isNaN(parsed.getTime())) {
                      lastDate = parsed;
                      attendances.push(formatLocalDate(lastDate));
                      hasSeenP = true;
                   }
                } else {
                   // Might just be a date string like "4-May"
                   let parsed = new Date(str);
                   if (isNaN(parsed.getTime())) {
                      parsed = new Date(`${str} ${lastDate.getFullYear()}`);
                   }
                   if (!isNaN(parsed.getTime())) {
                      lastDate = parsed;
                      attendances.push(formatLocalDate(lastDate));
                      hasSeenP = true;
                   }
                }
             }

             // Handle fallback comma-separated format
             const explicitAttendances = getVal(r, ["Attendance Dates (Comma separated YYYY-MM-DD)", "Attendance", "Attendances"]);
             if (explicitAttendances) {
                const explicit = String(explicitAttendances).split(',').map(s => s.trim()).filter(Boolean);
                for (const d of explicit) {
                   const parsed = new Date(d);
                   if (!isNaN(parsed.getTime())) {
                      attendances.push(formatLocalDate(parsed));
                   }
                }
             }

             return Array.from(new Set(attendances));
          };

          const startDateStr = parseDateString(getVal(row, ["Start Date (YYYY-MM-DD)", "Start Date", "Plan Start"]));

          const parsedRow: Partial<ParsedRow> = {
            id: `row-${Date.now()}-${index}`,
            studentName: String(getVal(row, ["Student Name", "Name"])),
            dateOfBirth: parseDateString(getVal(row, ["Date of birth (YYYY-MM-DD)", "Date of birth", "DOB"])),
            parentName: String(getVal(row, ["Parents name", "Parent Name", "Parent"])),
            contactNumber: String(getVal(row, ["Contact Number", "Contact", "Phone"])),
            admissionDate: parseDateString(getVal(row, ["Admission Date (YYYY-MM-DD)", "Admission Date", "Admission"])),
            startDate: startDateStr,
            endDate: parseDateString(getVal(row, ["End Date (YYYY-MM-DD)", "End Date", "Plan End"])),
            totalSessions: String(getVal(row, ["Total Sessions", "Session", "Sessions"])),
            fee: String(getVal(row, ["Fees", "Fee", "Amount"])),
            sessionsCompleted: String(getVal(row, ["Sessions Completed", "Ses Complete", "Completed"])),
            attendancesStr: parseAttendancesFromRow(row, startDateStr).join(', ')
          };

          parsedRow.errors = validateRow(parsedRow);
          return parsedRow as ParsedRow;
        });

        setData(parsedData);
      } catch (err) {
        setGlobalError("Failed to parse Excel file. Please ensure it matches the sample format.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const updateCell = (id: string, field: keyof ParsedRow, value: string) => {
    setData((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          updated.errors = validateRow(updated);
          return updated;
        }
        return row;
      })
    );
  };

  const removeRow = (id: string) => {
    setData((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    const hasErrors = data.some((r) => Object.keys(r.errors).length > 0);
    if (hasErrors) {
      alert("Please fix the highlighted errors before saving.");
      return;
    }
    if (data.length === 0) {
      alert("No data to save.");
      return;
    }

    setIsSaving(true);
    setGlobalError("");

    try {
      // Transform to BulkStudentPayload
      const payload = data.map((row) => {
        const hasPlan = row.startDate && row.endDate && row.totalSessions && row.fee;
        
        return {
          name: row.studentName,
          dateOfBirth: new Date(row.dateOfBirth),
          gender: "Other", // Default, could be added to excel
          parentName: row.parentName,
          contactNumber: row.contactNumber,
          admissionDate: new Date(row.admissionDate),
          plan: hasPlan ? {
             planType: "REGULAR" as const, // Defaulting to regular, can be expanded
             startDate: new Date(row.startDate),
             endDate: new Date(row.endDate),
             totalSessions: parseInt(row.totalSessions),
             fee: parseFloat(row.fee),
             sessionsCompleted: parseInt(row.sessionsCompleted || "0"),
          } : null,
          attendances: row.attendancesStr.split(',').map(s => s.trim()).filter(Boolean).map(d => new Date(d))
        };
      });

      const res = await bulkImportStudentsAction(payload as any);
      if (res.success) {
         alert(`Successfully imported ${res.importedCount} students!`);
         router.push('/students');
      } else {
         setGlobalError(res.message || "Failed to save");
      }
    } catch (err: any) {
      setGlobalError(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const renderCell = (row: ParsedRow, field: keyof ParsedRow, placeholder = "") => {
    const isError = row.errors[field];
    return (
      <td className="px-2 py-2 whitespace-nowrap">
        <input
          type="text"
          value={row[field] as string}
          onChange={(e) => updateCell(row.id, field, e.target.value)}
          placeholder={placeholder}
          title={isError ? (row.errors[field] as string) : ""}
          className={`w-full bg-transparent border-b text-sm focus:outline-none focus:border-brand-orange-500 transition-colors ${
            isError ? "border-red-500 text-red-600 dark:text-red-400 font-medium" : "border-transparent text-zinc-900 dark:text-zinc-100"
          }`}
        />
      </td>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Bulk Upload Students</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Import students and their historical data from an Excel spreadsheet.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadSample}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Sample
          </button>
          
          <div className="relative">
             <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                ref={fileInputRef}
             />
             <button
               className="inline-flex items-center gap-2 rounded-lg bg-brand-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-orange-600 transition-colors pointer-events-none"
             >
               <UploadCloud className="h-4 w-4" />
               {isUploading ? "Reading..." : "Upload .xlsx"}
             </button>
          </div>
        </div>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 p-4 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{globalError}</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="space-y-4">
           <div className="flex justify-between items-center">
             <p className="text-sm text-zinc-600 dark:text-zinc-400">
               Previewing <strong>{data.length}</strong> rows. Edit directly in the table if there are red highlights.
             </p>
             <button
               onClick={handleSave}
               disabled={isSaving}
               className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
             >
               {isSaving ? <UploadCloud className="h-4 w-4 animate-bounce" /> : <Save className="h-4 w-4" />}
               Save to Database
             </button>
           </div>
           
           <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-x-auto">
             <table className="min-w-max w-full text-left text-sm">
               <thead>
                 <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                   <th className="px-4 py-3">Student Name</th>
                   <th className="px-4 py-3">DOB (YYYY-MM-DD)</th>
                   <th className="px-4 py-3">Parent Name</th>
                   <th className="px-4 py-3">Contact</th>
                   <th className="px-4 py-3">Admission</th>
                   <th className="px-4 py-3">Plan Start</th>
                   <th className="px-4 py-3">Plan End</th>
                   <th className="px-4 py-3">Total Sessions</th>
                   <th className="px-4 py-3">Fees</th>
                   <th className="px-4 py-3">Attendances</th>
                   <th className="px-4 py-3">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                 {data.map((row) => (
                   <tr key={row.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                     {renderCell(row, "studentName")}
                     {renderCell(row, "dateOfBirth", "YYYY-MM-DD")}
                     {renderCell(row, "parentName")}
                     {renderCell(row, "contactNumber")}
                     {renderCell(row, "admissionDate", "YYYY-MM-DD")}
                     {renderCell(row, "startDate", "YYYY-MM-DD")}
                     {renderCell(row, "endDate", "YYYY-MM-DD")}
                     {renderCell(row, "totalSessions")}
                     {renderCell(row, "fee")}
                     {renderCell(row, "attendancesStr", "comma separated")}
                     <td className="px-4 py-2">
                       <button
                         onClick={() => removeRow(row.id)}
                         className="text-zinc-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {data.length === 0 && !globalError && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
           <UploadCloud className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
           <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No data imported yet</h3>
           <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
             Download the sample template, fill in your student data, and upload the file here to bulk import records.
           </p>
        </div>
      )}
    </div>
  );
}
