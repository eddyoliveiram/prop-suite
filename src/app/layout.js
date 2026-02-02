import { Fraunces, Space_Grotesk, Story_Script } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const storyScript = Story_Script({
  variable: "--font-story-script",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata = {
  title: "PropSuite",
  description: "Gerencie contas em mesas proprietarias com facilidade.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${spaceGrotesk.variable} ${fraunces.variable} ${storyScript.variable}`}>
        {children}
      </body>
    </html>
  );
}
