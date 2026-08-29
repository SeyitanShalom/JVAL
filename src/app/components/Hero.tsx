import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiRadio } from "react-icons/fi";

type HeroProps = {
  activeCompetitions: number;
  currentSeason: string;
  liveMatchCount: number;
};

export default function Hero({
  activeCompetitions,
  currentSeason,
  liveMatchCount,
}: HeroProps) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mt-7">
      <div className="flex flex-col items-center lg:items-start">
        <h1 className="font-black text-3xl text-center lg:text-left">
          Johnvents Apex League
        </h1>
        <h1 className="font-bold text-lg text-center lg:text-left">
          Game On With Goodness!
        </h1>
        <p className="text-center lg:text-left text-sm w-84 mb mt-3">
          Stay updated with real-time scores, team stats, and match-day actions
          from Johnvents Apex league. Dive into fixtures, player stats, and
          league tables all in one place. Football lives here.
        </p>
      </div>
      <Image
        src="/Hero Image.png"
        alt=""
        width={400}
        height={400}
        className="shrink-0"
      />
    </div>
  );
}
