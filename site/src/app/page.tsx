"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/phantom/nav";
import { Hero } from "@/components/phantom/hero";
import { Marquee } from "@/components/phantom/marquee";
import { Troupe } from "@/components/phantom/troupe";
import { SeanceDemo } from "@/components/phantom/demo";
import { Download } from "@/components/phantom/download";
import { Architecture } from "@/components/phantom/architecture";
import { Grimoire } from "@/components/phantom/grimoire";
import { Research } from "@/components/phantom/research";
import { Faq } from "@/components/phantom/faq";
import { Footer } from "@/components/phantom/footer";
import { LoadingScreen } from "@/components/phantom/loading-screen";
import { SceneStage } from "@/components/phantom/section-scene";

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* The loader alone owns the screen until the rite completes.
          Nothing else — not even Nav or Hero — is mounted until then. */}
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      {loaded && (
        <>
          <Nav />
          <main className="flex-1">
            {/* the hero keeps its own graveyard — every world below gets a staged one */}
            <Hero />
            <Marquee />
            <SceneStage variant="troupe">
              <Troupe />
            </SceneStage>
            <SceneStage variant="seance">
              <SeanceDemo />
            </SceneStage>
            <SceneStage variant="download">
              <Download />
            </SceneStage>
            <SceneStage variant="architecture">
              <Architecture />
            </SceneStage>
            <SceneStage variant="grimoire">
              <Grimoire />
            </SceneStage>
            <SceneStage variant="research">
              <Research />
            </SceneStage>
            <SceneStage variant="faq">
              <Faq />
            </SceneStage>
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}
