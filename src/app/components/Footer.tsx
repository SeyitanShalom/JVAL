import Image from "next/image";
import Link from "next/link";
import { SiGmail } from "react-icons/si";
import { RiInstagramFill } from "react-icons/ri";
import { FaFacebook } from "react-icons/fa";
import { IoLogoWhatsapp } from "react-icons/io";
import { HiPhone } from "react-icons/hi2";
import { MdLocationPin } from "react-icons/md";

const footerLinks = [
  { href: "/competitions", label: "Competitions" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/teams", label: "Teams" },
  { href: "/tables", label: "Tables" },
  { href: "/news", label: "News" },
  { href: "/about", label: "About" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-10 text-xs font-semibold text-slate-700">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-1">
            <Image src="/JV Logo.webp" alt="Johnvents" width={55} height={24} className="h-auto w-[55px]" />

            <Image src="/Apex Logo.png" alt="Apex League" width={65} height={30} className="h-auto w-[65px]" />
          </div>
          <p className="mt-4 max-w-sm text-xs leading-5 text-slate-600">
            Powered by Johnvents Foods. Built for fixtures, live updates, tables,
            player statistics, awards, and season archives.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Explore
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs font-bold text-slate-700 hover:text-blue-700">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Contact
          </p>
          <address className="mt-4 space-y-3 not-italic leading-relaxed">
            <p className="flex items-start gap-2">
              <MdLocationPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span>
                Off. no 20, Abundant Grace Of God Trade Centre, Off Akure High
                School Road, Akure, Ondo State
              </span>
            </p>
            <p className="flex items-center gap-2">
              <HiPhone className="h-4 w-4 text-blue-600" />
              <span>+234 813 498 0560, +234 906 475 0948</span>
            </p>
            <p className="flex items-center gap-2">
              <IoLogoWhatsapp className="h-4 w-4 text-blue-600" />
              <span>+234 814 589 0364</span>
            </p>
          </address>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-700">
            <span className="flex items-center gap-1">
              <FaFacebook className="h-4 w-4 text-blue-600" />
              Apex League
            </span>
            <span className="flex items-center gap-1">
              <RiInstagramFill className="h-4 w-4 text-blue-600" />
              ApexLeague01
            </span>
            <span className="flex items-center gap-1">
              <SiGmail className="h-4 w-4 text-blue-600" />
              hello.apexleague@gmail.com
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
