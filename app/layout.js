import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "AttendanceHR",
  description: "Attendance, leave & payroll management",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <div id="parea" />
      </body>
    </html>
  );
}
