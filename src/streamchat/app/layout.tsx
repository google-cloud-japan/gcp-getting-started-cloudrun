import "./globals.css";
import { Inter } from "next/font/google";
import AuthContext from "./context/AuthContext";
import ToasterContext from "./context/ToasterContext";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Stream Chat",
  description: "Chat app inspired by YouTube",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthContext>
            <ToasterContext />
            {children}
          </AuthContext>
        </Providers>
      </body>
    </html>
  );
}
