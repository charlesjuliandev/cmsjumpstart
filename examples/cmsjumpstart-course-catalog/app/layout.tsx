import type {
  Metadata
} from "next";

import "./globals.css";

export const metadata: Metadata = {
  title:
    "CMSJumpstart Course Catalog",

  description:
    "A Next.js example using CMSJumpstart to deliver typed Drupal Course content through JSON:API."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}