import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          const parsedCredentials = z
            .object({ email: z.string().min(1), password: z.string().min(6) })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            return null;
          }

          const { email, password } = parsedCredentials.data;

          // Check if it's a sibling switch bypass request
          if (email === "sibling_switch_token" && password) {
            const { verifySwitchToken } = await import("@/lib/switch-tokens");
            const studentId = verifySwitchToken(password);
            if (studentId) {
              const student = await prisma.student.findUnique({
                where: { id: studentId },
              });
              if (student) {
                return {
                  id: student.id,
                  name: student.name,
                  email: `student_${student.studentNumber}@academy.com`,
                  role: "PARENT",
                };
              }
            }
            return null;
          }

          // Check if email matches roll number pattern (e.g., TAG173, TAG-173, or just 173)
          const rollNumberMatch = email.match(/^(TAG-?)?(\d+)$/i);
          if (rollNumberMatch) {
            const studentNumber = parseInt(rollNumberMatch[2], 10);
            const student = await prisma.student.findUnique({
              where: { studentNumber },
            });

            if (!student || !student.password) {
              return null;
            }

            const passwordsMatch = await bcrypt.compare(password, student.password);
            if (!passwordsMatch) {
              return null;
            }

            return {
              id: student.id,
              name: student.name,
              email: `student_${student.studentNumber}@academy.com`,
              role: "PARENT",
            };
          }

          // Otherwise, authenticate as Staff (User)
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
});

