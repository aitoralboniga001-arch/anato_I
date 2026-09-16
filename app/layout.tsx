import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Embriologia interaktiboa",
  description: "Garapenaren lehenengo eta bigarren asteak ikasteko simulagailu bisuala.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="eu">
      <body>{children}</body>
    </html>
  );
}
